import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const base = process.env.DEMO_UI_URL || "http://127.0.0.1:5173";
const output = process.env.DEMO_QA_DIR || "/tmp/fitwork-demo-qa";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
page.setDefaultTimeout(6000);
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
let role = "COMPANY",
  generation = 0,
  signedIn = false,
  created = 0,
  aiMode = 201;
let deadline = Date.now() + 3600000;
let aiUsed = 0;
const jobs = ["Backend Engineer", "Frontend Engineer", "Product Designer"].map(
  (title, i) => ({
    publicId: `job-${i}`,
    title,
    isFeatured: i === 0,
    description: "Help build thoughtful products with a collaborative team.",
  }),
);
const resumes = ["Taylor Morgan", "Alex Lee", "Sam Nguyen"].map((name, i) => ({
  publicId: `resume-${i}`,
  fileName: `${name}.pdf`,
  isPrimaryApplicant: i === 0,
}));
const applications = resumes.map((resume, i) => ({
  publicId: `application-${i}`,
  jobPublicId: "job-0",
  resumePublicId: resume.publicId,
  applicantName: resume.fileName.slice(0, -4),
  isPrimaryApplicant: i === 0,
  status: "PENDING",
  sampleEvaluationPublicId: `sample-${i}`,
  latestEvaluationPublicId: `sample-${i}`,
  evaluations: [
    {
      publicId: `sample-${i}`,
      source: "SAMPLE",
      status: "COMPLETED",
      overallScore: [100, 33, 0][i],
    },
  ],
}));
let issuedToken = "";
const token = () =>
  `header.${Buffer.from(JSON.stringify({ sub: role, email: "demo@example.com", role: `ROLE_${role}`, exp: Math.floor(Date.now() / 1000) + 900, demoSessionId: "workspace", demoExpiresAt: deadline, demoGeneration: generation })).toString("base64url")}.signature`;
function workspace() {
  return {
    id: "workspace",
    expiresAt: new Date(deadline).toISOString(),
    userType: role,
    generation,
    ai: {
      used: aiUsed,
      limit: 3,
      remaining: Math.max(0, 3 - aiUsed),
      available: true,
      unavailableReason: null,
    },
    uploads: { used: 0, limit: 3, remaining: 3, maxFileBytes: 5 * 1024 * 1024 },
    jobs,
    resumes: role === "COMPANY" ? resumes : resumes.slice(0, 1),
    applications:
      role === "COMPANY"
        ? applications
        : applications.filter((a) => a.isPrimaryApplicant),
  };
}
function evaluation(id) {
  const item = applications
    .flatMap((a) => a.evaluations)
    .find((e) => e.publicId === id);
  assert.ok(item, `Known evaluation ${id}`);
  return {
    publicId: id,
    source: item.source,
    overallScore: item.overallScore,
    scoreBreakdown: {
      schemaVersion: 2,
      criteria: [
        { criterionId: "backend", scoreContribution: item.overallScore },
      ],
    },
    evidence: {
      schemaVersion: 2,
      criteria: [
        {
          criterionId: "backend",
          criterionText: "Backend experience",
          verdict: item.overallScore > 0 ? "MATCHED" : "MISSING",
          scoreContribution: item.overallScore,
          explanation: "Evidence supports this score.",
          evidence: [
            {
              snippet: "Developed APIs",
              section: "resume",
              startOffset: 0,
              endOffset: 14,
            },
          ],
        },
      ],
    },
    ...(role === "COMPANY"
      ? {
          decisionSupportOnly: true,
          resumeRedaction: {
            redactedResumeText: "Developed APIs",
            redactedResumeVersion: "v1",
          },
          metadata: { model: "sample" },
        }
      : {}),
  };
}
const requests = [];
await context.route("http://localhost:3000/**", async (route) => {
  const req = route.request(),
    url = new URL(req.url());
  const send = (body, status = 200) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  if (url.pathname.startsWith("/socket.io")) return send({}, 503);
  requests.push(`${req.method()} ${url.pathname}`);
  if (url.pathname === "/api/auth/refresh")
    return signedIn
      ? send({ accessToken: (issuedToken = token()), expiresIn: 900 })
      : send({ message: "Expired" }, 401);
  if (url.pathname === "/api/auth/demo") {
    assert.deepEqual(req.postDataJSON(), { userType: "COMPANY" });
    role = "COMPANY";
    generation = 0;
    signedIn = true;
    created++;
    deadline = Date.now() + 3600000;
    return send({ accessToken: (issuedToken = token()), expiresIn: 900 }, 201);
  }
  assert.equal(req.headers().authorization, `Bearer ${issuedToken}`);
  if (url.pathname === "/api/auth/demo/switch") {
    role = req.postDataJSON().userType;
    generation++;
    return send({ accessToken: (issuedToken = token()), expiresIn: 900 });
  }
  if (url.pathname === "/api/auth/logout") {
    signedIn = false;
    return route.fulfill({ status: 204 });
  }
  if (url.pathname === "/api/demo/session") return send(workspace());
  if (url.pathname === "/api/job" || url.pathname === "/api/job/applied")
    return send({
      items: url.pathname.endsWith("/applied")
        ? applications.filter((a) => a.isPrimaryApplicant)
        : jobs,
      totalPages: 1,
      pageNumber: 1,
      pageSize: 20,
      hasPrevious: false,
      hasNext: false,
    });
  if (url.pathname.endsWith("/apply")) {
    const id = url.pathname.split("/")[3];
    assert.deepEqual(req.postDataJSON(), {
      resumePublicId: "resume-0",
      coverLetter: "I would like to contribute to your team.",
      proposedRate: 15000000,
      estimatedDay: 30,
    });
    applications.push({
      publicId: `application-${id}`,
      jobPublicId: id,
      resumePublicId: "resume-0",
      applicantName: "Taylor Morgan",
      isPrimaryApplicant: true,
      status: "PENDING",
      sampleEvaluationPublicId: null,
      latestEvaluationPublicId: null,
      evaluations: [],
    });
    return send({ message: "Applied successfully" }, 201);
  }
  if (url.pathname === "/api/applicant-evaluation" && req.method() === "POST") {
    const input = req.postDataJSON();
    const app = applications.find(
      (a) =>
        a.jobPublicId === input.jobPublicId &&
        a.resumePublicId === input.resumePublicId,
    );
    assert.ok(app, "Apply before AI");
    if (aiMode !== 201) return send({ message: "AI unavailable" }, aiMode);
    const id = `live-${app.publicId}`;
    app.evaluations.push({
      publicId: id,
      source: "LIVE",
      status: "PROCESSING",
      overallScore: null,
    });
    app.latestEvaluationPublicId = id;
    aiUsed++;
    return send({ publicId: id }, 201);
  }
  if (url.pathname.startsWith("/api/applicant-evaluation/")) {
    const id =
      role === "COMPANY"
        ? url.pathname.split("/").at(-1)
        : url.searchParams.get("evaluationPublicId");
    assert.ok(id, "Evaluation must be selected explicitly");
    return send(evaluation(id));
  }
  if (url.pathname.endsWith("/download-url")) {
    assert.equal(url.searchParams.get("disposition"), "inline");
    return send({ downloadUrl: "https://demo-cv.test/sample.pdf" });
  }
  if (url.pathname.endsWith("/status")) {
    const app = applications.find(
      (a) => a.publicId === url.pathname.split("/")[4],
    );
    assert.ok(app);
    const status = req.postDataJSON().status;
    if (status === "COMPLETED") assert.equal(app.status, "ACCEPTED");
    app.status = status;
    return send({ message: "Updated" });
  }
  throw new Error(`Unexpected request ${req.method()} ${url.pathname}`);
});
await context.route("https://demo-cv.test/**", (route) =>
  route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<html><body>Prepared CV preview</body></html>",
  }),
);
try {
  await page.clock.install();
  await page.goto(`${base}/auth/sign-in`);
  await page.getByRole("link", { name: "Try demo", exact: true }).click();
  await page
    .getByRole("heading", { name: "Meet your next great hire." })
    .waitFor();
  assert.equal(created, 1);
  assert.equal(await page.locator(".demo-application").count(), 3);
  await page
    .locator(".demo-application")
    .nth(2)
    .getByRole("button", { name: "Open sample", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByText("0", { exact: true })
    .first()
    .waitFor();
  await page.getByRole("button", { name: "Close result" }).click();
  await page
    .locator(".demo-application")
    .first()
    .getByRole("button", { name: "Preview CV", exact: true })
    .click();
  await page.getByRole("dialog").locator("iframe").waitFor();
  await page.screenshot({ path: `${output}/cv-preview.png` });
  await page.getByRole("button", { name: "Close preview" }).click();
  await page.waitForFunction(() =>
    document.activeElement?.textContent?.includes("Preview CV"),
  );
  await page.screenshot({
    path: `${output}/recruiter-desktop.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Switch to applicant" }).click();
  await page
    .getByRole("heading", { name: "Find your next opportunity." })
    .waitFor();
  assert.equal(await page.locator(".demo-application").count(), 1);
  await page
    .locator(".demo-jobs article")
    .nth(1)
    .getByRole("button", { name: "Apply to job" })
    .click();
  await page.waitForFunction(
    () => document.querySelectorAll(".demo-application").length === 2,
  );
  const first = page.locator(".demo-application").first();
  await first.getByRole("button", { name: "Run live AI" }).click();
  await first.getByText("PROCESSING · You can open the sample").waitFor();
  await first.getByRole("button", { name: "Reopen sample" }).click();
  await page
    .getByRole("dialog")
    .getByText("Sample result", { exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Close result" }).click();
  applications[0].evaluations.at(-1).status = "FAILED";
  await page.getByRole("button", { name: "Refresh workspace" }).click();
  await first.getByRole("button", { name: "Retry AI" }).waitFor();
  aiMode = 429;
  await first.getByRole("button", { name: "Retry AI" }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Demo quota reached" })
    .waitFor();
  await first.getByRole("button", { name: "Reopen sample" }).click();
  await page.getByRole("button", { name: "Close result" }).click();
  aiMode = 503;
  await first.getByRole("button", { name: "Retry AI" }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Live AI is unavailable" })
    .waitFor();
  applications[0].evaluations.at(-1).status = "COMPLETED";
  applications[0].evaluations.at(-1).overallScore = 78;
  await page.getByRole("button", { name: "Refresh workspace" }).click();
  await first.getByRole("button", { name: "Open AI result" }).waitFor();
  await page.reload();
  await page
    .getByRole("heading", { name: "Find your next opportunity." })
    .waitFor();
  assert.equal(created, 1, "Reload restores the same role/workspace");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({
    path: `${output}/applicant-mobile.png`,
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    "No mobile horizontal overflow",
  );
  await page.getByRole("button", { name: "Switch to recruiter" }).click();
  await page
    .getByRole("heading", { name: "Meet your next great hire." })
    .waitFor();
  await first.getByRole("button", { name: "Open AI result" }).click();
  await page
    .getByRole("dialog")
    .getByRole("heading", { name: "Live AI result", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Close result" }).click();
  await first.getByRole("button", { name: "Accept", exact: true }).click();
  await first.getByText("ACCEPTED", { exact: true }).waitFor();
  await first.getByRole("button", { name: "Complete", exact: true }).click();
  await first.getByText("COMPLETED", { exact: true }).waitFor();
  await page
    .locator(".demo-application")
    .nth(1)
    .getByRole("button", { name: "Reject", exact: true })
    .click();
  await page
    .locator(".demo-application")
    .nth(1)
    .getByText("REJECTED", { exact: true })
    .waitFor();
  await page.getByRole("button", { name: "End demo" }).click();
  await page
    .getByRole("heading", { name: "Demo expired — Start new demo" })
    .waitFor();
  await page.reload();
  await page.getByRole("button", { name: "Start new demo" }).waitFor();
  assert.equal(created, 1, "Expired refresh must not create another demo");
  await page.getByRole("button", { name: "Start new demo" }).click();
  await page
    .getByRole("heading", { name: "Meet your next great hire." })
    .waitFor();
  assert.equal(created, 2);
  // Simulate a restored session in a tab without the initial browser marker.
  await page.evaluate(() => sessionStorage.removeItem("fitwork.demo.visited"));
  await page.reload();
  await page
    .getByRole("heading", { name: "Meet your next great hire." })
    .waitFor();
  await page.clock.fastForward(3600001);
  await page
    .getByRole("heading", { name: "Demo expired — Start new demo" })
    .waitFor();
  assert.equal(created, 2, "Workspace deadline requires explicit restart");
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      passed: true,
      scenarios: [
        "default company",
        "zero-score V2 sample",
        "CV",
        "switch",
        "apply",
        "sample during processing/failure",
        "429",
        "503",
        "role restored on reload",
        "mobile",
        "live recruiter result",
        "accept/complete/reject",
        "logout bearer",
        "expiry",
        "explicit restart",
      ],
      requests: requests.length,
      screenshots: output,
    }),
  );
} finally {
  await browser.close();
}
