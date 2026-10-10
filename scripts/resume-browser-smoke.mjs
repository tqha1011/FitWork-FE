import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir } from "node:fs/promises";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const { Server } = await import(
  process.env.SOCKET_IO_SERVER_MODULE || "socket.io"
);
const base = process.env.JOB_UI_URL || "http://127.0.0.1:5173";
const output = process.env.RESUME_QA_DIR || "/tmp/fitwork-resume-qa";
await mkdir(output, { recursive: true });
const http = createServer();
const io = new Server(http, {
  transports: ["polling"],
  cors: { origin: true, credentials: true },
});
await new Promise((resolve) => http.listen(0, "127.0.0.1", resolve));
const port = http.address().port;
const resumeId = "831290c4-2a95-4359-a8aa-5042ba51bc70";
const jobId = "2c143b75-72c3-43bd-9d18-280a2d7c1990";
const evaluationId = "61f25b9f-75ed-47ea-a32b-71ce5a498252";
const state = {
  role: "ROLE_APPLICANT",
  applications: [],
  revision: 1,
  resumeStatus: "COMPLETED",
  requests: [],
  joinCount: 0,
  evaluationPosts: 0,
  detailReady: false,
  creationFails: false,
  downloads: 0,
  evaluationStatus: "FAILED",
};
const currentResume = () => ({
  resumePublicId: resumeId,
  ingestionPublicId: `ingestion-${state.revision}`,
  status: state.resumeStatus,
  updatedAt: new Date().toISOString(),
  ...(state.resumeStatus === "FAILED"
    ? { errorMessage: "Unreadable resume" }
    : {}),
});
io.of("/resume").on("connection", (socket) => {
  assert.equal(socket.handshake.auth.token.startsWith("Bearer"), false);
  socket.on("resume-join", ({ resumePublicId }) => {
    assert.equal(resumePublicId, resumeId);
    state.joinCount++;
    socket.emit("resume-join", { joined: true, current: currentResume() });
    socket.emit("ingestion-process-notify", {
      ...currentResume(),
      ingestionPublicId: "obsolete",
      status: "FAILED",
      errorMessage: "OBSOLETE EVENT MUST NOT APPEAR",
    });
  });
});
io.of("/evaluation").on("connection", (socket) => {
  socket.on("evaluation-join", ({ evaluationPublicId }) => {
    assert.equal(evaluationPublicId, evaluationId);
    socket.emit("evaluation-join", {
      joined: true,
      current: {
        evaluationPublicId,
        status: state.evaluationStatus,
        updatedAt: new Date().toISOString(),
        ...(state.evaluationStatus === "FAILED"
          ? { errorMessage: "Model temporarily unavailable" }
          : { overallScore: 0 }),
      },
    });
  });
});
const job = {
  publicId: jobId,
  title: "Build a TypeScript dashboard",
  description: "Build a useful accessible dashboard",
  budget: 1000,
  currency: "USD",
  location: "Remote",
  skills: [{ id: 1, name: "TypeScript" }],
  category: { id: 1, name: "Engineering" },
  arrangement: { id: 1, name: "Remote" },
  dueAt: "2027-12-01T00:00:00Z",
  totalApplicants: 0,
};
const v2 = {
  publicId: evaluationId,
  overallScore: 0,
  scoreBreakdown: {
    schemaVersion: 2,
    criteria: [
      { criterionId: "b", scoreContribution: 0 },
      { criterionId: "a", scoreContribution: 0 },
    ],
  },
  evidence: {
    schemaVersion: 2,
    strengths: ["Clear project history"],
    gaps: ["More skills evidence needed"],
    explanation: "Review the skills evidence",
    criteria: [
      {
        criterionId: "a",
        criterionText: "TypeScript experience",
        verdict: "MISSING",
        scoreContribution: 0,
        explanation: "No supporting evidence",
        evidence: [
          {
            snippet: "TypeScript",
            section: "resume",
            startOffset: 0,
            endOffset: 10,
          },
        ],
      },
      {
        criterionId: "b",
        criterionText: "React experience",
        verdict: "PARTIAL",
        scoreContribution: 0,
        explanation: "Limited evidence",
        evidence: [],
      },
    ],
  },
};
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await context.route("http://localhost:3000/socket.io/**", async (route) => {
  try {
    const url = new URL(route.request().url());
    const response = await route.fetch({
      url: `http://127.0.0.1:${port}${url.pathname}${url.search}`,
      timeout: 30000,
    });
    await route.fulfill({ response });
  } catch {
    if (!page.isClosed()) await route.abort().catch(() => {});
  }
});
await context.route("https://storage.example/**", async (route) => {
  if (route.request().method() === "PUT") {
    assert.equal(route.request().headers().authorization, undefined);
    assert.equal(route.request().headers()["content-type"], "application/pdf");
  }
  await route.fulfill({
    status: 200,
    contentType: "application/pdf",
    body: "%PDF-1.4\nmock",
  });
});
await context.route("http://localhost:3000/api/**", async (route) => {
  const req = route.request();
  const url = new URL(req.url());
  const method = req.method();
  const path = url.pathname;
  const body = req.postData() ? JSON.parse(req.postData()) : undefined;
  state.requests.push({ path, method, body });
  const send = (data, status = 200) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: status === 204 ? "" : JSON.stringify(data),
    });
  if (path.includes("/auth/")) {
    const token = `header.${Buffer.from(JSON.stringify({ sub: "user", email: "test@example.com", role: state.role, exp: Math.floor(Date.now() / 1000) + 900 })).toString("base64url")}.signature`;
    return send({ accessToken: token, expiresIn: 900 });
  }
  assert.match(req.headers().authorization, /^Bearer /);
  if (["/api/categories", "/api/skills", "/api/arrangements"].includes(path))
    return send([{ id: 1, name: "TypeScript" }]);
  if (path === "/api/job/applied")
    return send({
      items: state.applications,
      totalPages: state.applications.length ? 1 : 0,
      pageNumber: 1,
      pageSize: 100,
      hasPrevious: false,
      hasNext: false,
    });
  if (path === "/api/job")
    return send({
      items: [job],
      totalPages: 1,
      pageNumber: 1,
      pageSize: 20,
      hasNext: false,
      hasPrevious: false,
    });
  if (path.endsWith("/apply")) {
    state.applications = [
      {
        jobApplicantPublicId: "application",
        jobPublicId: jobId,
        resumePublicId: body.resumePublicId,
        status: "PENDING",
        proposedRate: 0,
        estimatedDays: 1,
        appliedAt: new Date().toISOString(),
        matchingScore: 0,
      },
    ];
    return send({ message: "Applied" });
  }
  if (path === "/api/resume/upload-url")
    return send(
      {
        uploadUrl: "https://storage.example/upload",
        storageKey: `user/user/key-${state.revision}/cv.pdf`,
        expiresAt: "2027-01-01T00:00:00Z",
      },
      201,
    );
  if (path === "/api/resume" && method === "POST") {
    if (state.creationFails) return send({ message: "Queue unavailable" }, 500);
    return send(
      {
        publicId: resumeId,
        ingestionPublicId: `ingestion-${state.revision}`,
        ingestionStatus: "PENDING",
      },
      201,
    );
  }
  if (path.endsWith("/download-url")) {
    state.downloads++;
    return send({ downloadUrl: "https://storage.example/download" });
  }
  if (path === `/api/resume/${resumeId}`) {
    if (method === "DELETE") return send(undefined, 204);
    assert.equal(typeof body.name, "string");
    assert.equal(typeof body.storageKey, "string");
    return send({
      publicId: resumeId,
      ingestionPublicId: `ingestion-${state.revision}`,
      ingestionStatus: state.resumeStatus,
    });
  }
  if (path === "/api/applicant-evaluation") {
    assert.equal(state.applications.length, 1);
    assert.deepEqual(body, { resumePublicId: resumeId, jobPublicId: jobId });
    state.evaluationPosts++;
    state.detailReady = state.evaluationPosts > 1;
    state.evaluationStatus = state.detailReady ? "COMPLETED" : "FAILED";
    return send({ publicId: evaluationId }, 201);
  }
  if (path === `/api/applicant-evaluation/${evaluationId}`)
    return state.detailReady
      ? send(v2)
      : send({ message: "Applicant evaluation is not completed" }, 409);
  if (path === `/api/applicant-evaluation/jobs/${jobId}/${evaluationId}`)
    return send({
      ...v2,
      scoreBreakdown: {
        schemaVersion: 1,
        skills: 2,
        experience: 3,
        education: 4,
        overallFit: 5,
      },
      evidence: {
        schemaVersion: 1,
        strengths: ["TypeScript background"],
        gaps: [],
        explanation: "Decision support only",
      },
      decisionSupportOnly: true,
      resumeRedaction: {
        redactedResumeText: null,
        redactedResumeVersion: null,
      },
      metadata: {},
    });
  throw new Error(`Unhandled route ${method} ${path}`);
});
const file = {
  name: "resume.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4 example"),
};
async function upload(name) {
  await page
    .getByRole("button", { name: "Upload resume", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Resume file").setInputFiles(file);
  await dialog.getByLabel("Resume name").fill(name);
  await dialog
    .getByRole("button", { name: "Upload resume", exact: true })
    .click();
}
try {
  await page.goto(`${base}/freelancer/resumes`);
  await upload("TypeScript CV");
  await page.getByText("Ready to use", { exact: true }).waitFor();
  assert.equal(
    await page.getByText("OBSOLETE EVENT MUST NOT APPEAR").count(),
    0,
  );
  await page.screenshot({
    path: `${output}/resumes-desktop.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page.locator("iframe").waitFor();
  await page
    .getByRole("button", { name: "Close preview", exact: true })
    .click();
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page
    .getByRole("button", { name: "Close preview", exact: true })
    .click();
  assert.equal(state.downloads, 2);
  state.revision = 2;
  state.resumeStatus = "FAILED";
  await page.getByRole("button", { name: "Replace file" }).click();
  await page.getByLabel("Resume file").setInputFiles(file);
  await page.getByLabel("Resume name").fill("Updated CV");
  await page.getByRole("button", { name: "Save replacement" }).click();
  await page.getByText("Reading failed", { exact: true }).waitFor();
  await page.getByText("Unreadable resume", { exact: true }).waitFor();
  state.resumeStatus = "COMPLETED";
  await page.getByRole("button", { name: "Retry reading" }).click();
  await page.getByText("Ready to use", { exact: true }).waitFor();
  await page
    .getByText("Connecting to live updates…", { exact: true })
    .waitFor({ state: "hidden" });
  assert.ok(state.joinCount >= 3);
  await page.getByRole("link", { name: "Find Jobs", exact: true }).click();
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await page
    .getByLabel("Use a resume from this session")
    .selectOption(resumeId);
  await page
    .getByLabel("Cover letter", { exact: true })
    .fill("I have relevant experience.");
  await page.getByLabel("Proposed amount (USD)", { exact: true }).fill("0");
  await page.getByLabel("Estimated days", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Submit application" }).click();
  await page.getByRole("button", { name: "Evaluate this application" }).click();
  await page.getByText("Evaluation failed", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Retry evaluation" }).click();
  await page
    .getByRole("heading", { name: "Overall fit", exact: true })
    .waitFor();
  assert.equal(
    (await page.locator(".evaluation-score").innerText()).replace(/\s/g, ""),
    "0/100",
  );
  assert.equal(
    await page.locator(".evaluation-table tbody tr").first().innerText(),
    "React experience\t0",
  );
  await page.screenshot({
    path: `${output}/evaluation-desktop.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page
    .getByRole("link", { name: "My Applications", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Overall fit", exact: true })
    .waitFor();
  await page.setViewportSize({ width: 375, height: 812 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
  );
  await page.screenshot({
    path: `${output}/evaluation-mobile.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "My Resumes", exact: true }).click();
  await page.screenshot({
    path: `${output}/resumes-mobile.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Delete Updated CV" }).click();
  await page
    .getByRole("button", { name: "Delete resume", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Your next opportunity starts with your CV" })
    .waitFor();
  state.creationFails = true;
  await upload("Uncertain registration");
  await page
    .getByText("The resume may already have been saved.", { exact: false })
    .waitFor();
  assert.equal(
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Upload resume", exact: true })
      .isDisabled(),
    true,
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  state.role = "ROLE_COMPANY";
  await page.goto(`${base}/client/evaluations`);
  await page
    .getByRole("heading", { name: "Applicant results are not available yet" })
    .waitFor();
  await page.goto(`${base}/client/jobs/${jobId}/evaluations/${evaluationId}`);
  await page.getByText("Decision support result", { exact: true }).waitFor();
  await page.getByText("Resume text used for evaluation").click();
  await page
    .getByText("Resume text is unavailable for this evaluation.")
    .waitFor();
  assert.equal(
    await page.locator(".evaluation-breakdown dd").first().innerText(),
    "2",
  );
  await page.screenshot({
    path: `${output}/company-mobile.png`,
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        passed: [
          "resume upload + immediate snapshot",
          "stale ingestion filter",
          "fresh preview URL",
          "replacement + retry",
          "apply with existing resume",
          "failed evaluation retry + zero V2 result",
          "criterion ID matching",
          "application history result",
          "375px layout",
          "DELETE 204",
          "uncertain create blocks retry",
          "company V1/null text/dependency",
        ],
        screenshots: output,
      },
      null,
      2,
    ),
  );
} catch (error) {
  await page
    .screenshot({ path: `${output}/failure.png`, fullPage: true })
    .catch(() => {});
  console.error(
    JSON.stringify(
      { browserErrors: errors, lastRequests: state.requests.slice(-6) },
      null,
      2,
    ),
  );
  throw error;
} finally {
  await context.close();
  await browser.close();
  await new Promise((resolve) => io.close(resolve));
}
