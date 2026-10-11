import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const base = process.env.JOB_UI_URL || "http://127.0.0.1:5173";
const output =
  process.env.EVALUATION_QA_DIR || "/tmp/fitwork-applicant-evaluation-qa";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
page.setDefaultTimeout(5000);
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
let role = "ROLE_APPLICANT";
let signedIn = true;
let status = 200;
let releaseSlow;
let slowStarted;
let evaluationRequests = 0;
let latestId = "evaluation-v1";
let latestScore = 73;
const unexpected = [];
const v1 = {
  publicId: "evaluation-v1",
  overallScore: 73,
  scoreBreakdown: {
    schemaVersion: 1,
    skills: 80,
    experience: 70,
    education: 65,
    overallFit: 73,
  },
  evidence: {
    schemaVersion: 1,
    strengths: ["Relevant projects"],
    gaps: ["Leadership experience"],
    explanation: "Your projects support this application.",
  },
};
// V2 may contain criteria without the V1 summary fields.
const v2 = {
  publicId: "evaluation-v2",
  overallScore: 0,
  scoreBreakdown: {
    schemaVersion: 2,
    criteria: [{ criterionId: "react", scoreContribution: 0 }],
  },
  evidence: {
    schemaVersion: 2,
    criteria: [
      {
        criterionId: "react",
        criterionText: "React experience",
        verdict: "PARTIAL",
        scoreContribution: 0,
        explanation: "Limited React evidence",
        evidence: [
          {
            snippet: "Built a React dashboard",
            section: "resume",
            startOffset: 12,
            endOffset: 35,
          },
        ],
      },
    ],
  },
};
await context.route("http://localhost:3000/**", async (route) => {
  const req = route.request();
  const url = new URL(req.url());
  const send = (data, code = 200) =>
    route.fulfill({
      status: code,
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  if (url.pathname === "/api/auth/refresh") {
    if (!signedIn) return send({ message: "Unauthorized" }, 401);
    const token = `header.${Buffer.from(JSON.stringify({ sub: "applicant", email: "applicant@example.com", role, exp: Math.floor(Date.now() / 1000) + 900 })).toString("base64url")}.signature`;
    return send({ accessToken: token, expiresIn: 900 });
  }
  if (
    ["/api/categories", "/api/skills", "/api/arrangements"].includes(
      url.pathname,
    )
  )
    return send([]);
  if (["/api/job", "/api/job/applied"].includes(url.pathname))
    return send({
      items:
        url.pathname === "/api/job/applied"
          ? ["v1", "v2"].map((id) => ({
              jobPublicId: id,
              jobApplicantPublicId: `application-${id}`,
              resumePublicId: `resume-${id}`,
              status: "APPLIED",
              proposedRate: 0,
              estimatedDays: 1,
              appliedAt: "2026-10-10T00:00:00Z",
              matchingScore: 0,
            }))
          : [],
      totalPages: url.pathname === "/api/job/applied" ? 1 : 0,
      pageNumber: 1,
      pageSize: 100,
      hasNext: false,
      hasPrevious: false,
    });
  if (
    url.pathname.startsWith("/api/applicant-evaluation/") &&
    req.method() === "GET"
  ) {
    evaluationRequests++;
    assert.match(req.headers().authorization, /^Bearer /);
    assert.equal(url.search, "");
    assert.equal(req.postData(), null);
    const id = decodeURIComponent(
      url.pathname.slice("/api/applicant-evaluation/".length),
    );
    if (id === "slow") {
      slowStarted?.();
      await new Promise((resolve) => {
        releaseSlow = resolve;
      });
      return send({
        ...v1,
        publicId: "slow",
        evidence: { ...v1.evidence, explanation: "OBSOLETE RESULT" },
      }).catch(() => {});
    }
    if (status === "network") return route.abort("failed");
    if (status !== 200) return send({ message: "Test error" }, status);
    return send(
      id === "v2"
        ? v2
        : { ...v1, publicId: latestId, overallScore: latestScore },
    );
  }
  unexpected.push(`${req.method()} ${url.pathname}`);
  return send({ message: "Unexpected request" }, 500);
});
const open = (id) => page.goto(`${base}/freelancer/evaluations/${id}`);
try {
  await page.goto(`${base}/freelancer/applications`);
  const cards = page.locator(".application-card");
  await cards.nth(1).waitFor();
  assert.equal(
    evaluationRequests,
    0,
    "Do not fetch results until View evaluation is clicked",
  );
  await cards
    .first()
    .getByRole("button", { name: "View evaluation", exact: true })
    .click();
  await cards.first().getByText("Relevant projects", { exact: true }).waitFor();
  assert.equal(
    new URL(page.url()).pathname,
    "/freelancer/applications",
    "View evaluation must display the result in its application card",
  );
  assert.equal(await cards.nth(1).locator(".evaluation-score").count(), 0);
  assert.equal(
    (await cards.first().locator(".evaluation-score").innerText()).replace(
      /\s/g,
      "",
    ),
    "73/100",
  );
  status = 409;
  await cards.first().getByRole("button", { name: "Refresh result" }).click();
  await cards
    .first()
    .getByRole("status")
    .filter({ hasText: "No completed result" })
    .waitFor();
  assert.equal(
    await cards.first().locator(".evaluation-score").count(),
    0,
    "A newer pending evaluation must hide the old completed result",
  );
  status = 200;
  latestId = "evaluation-new";
  latestScore = 91;
  await cards.first().getByRole("button", { name: "Refresh result" }).click();
  await cards.first().getByText("Relevant projects", { exact: true }).waitFor();
  assert.equal(
    (await cards.first().locator(".evaluation-score").innerText()).replace(
      /\s/g,
      "",
    ),
    "91/100",
  );
  await cards.first().getByRole("button", { name: "Hide evaluation" }).click();
  assert.equal(await cards.first().locator(".evaluation-score").count(), 0);
  await cards
    .nth(1)
    .getByRole("button", { name: "View evaluation", exact: true })
    .click();
  await cards
    .nth(1)
    .getByText("Limited React evidence", { exact: true })
    .waitFor();
  await page.reload();
  await cards
    .nth(1)
    .getByRole("button", { name: "View evaluation", exact: true })
    .click();
  await cards
    .nth(1)
    .getByText("Limited React evidence", { exact: true })
    .waitFor();
  await page.screenshot({
    path: `${output}/inline-desktop.png`,
    fullPage: true,
  });
  latestId = "evaluation-v1";
  latestScore = 73;
  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 812 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
    );
  }
  await page.screenshot({
    path: `${output}/inline-mobile.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/freelancer/evaluations`);
  await page
    .getByRole("heading", { name: "My Evaluations", exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("heading", { name: "My Evaluations", exact: true })
      .count(),
    1,
    "Applicant needs a routed evaluation viewer independent of session resume references",
  );
  const beforeEmpty = evaluationRequests;
  await page.getByLabel("Job ID", { exact: true }).fill("   ");
  await page
    .getByRole("button", { name: "View evaluation", exact: true })
    .click();
  assert.equal(
    evaluationRequests,
    beforeEmpty,
    "Whitespace must not request an evaluation",
  );
  await page.getByLabel("Job ID", { exact: true }).fill("  v1  ");
  await page.getByLabel("Job ID", { exact: true }).press("Enter");
  await page.waitForURL("**/freelancer/evaluations/v1");
  await page.getByText("Relevant projects", { exact: true }).waitFor();
  assert.equal(
    (await page.locator(".evaluation-score").innerText()).replace(/\s/g, ""),
    "73/100",
  );
  assert.equal(
    await page.locator(".evaluation-breakdown dd").first().innerText(),
    "80",
  );
  await page.reload();
  await page.getByText("Relevant projects", { exact: true }).waitFor();
  await page.screenshot({ path: `${output}/v1-desktop.png`, fullPage: true });
  await open("v2");
  await page.getByText("Limited React evidence", { exact: true }).waitFor();
  assert.equal(
    (await page.locator(".evaluation-score").innerText()).replace(/\s/g, ""),
    "0/100",
  );
  await page.getByText("Built a React dashboard", { exact: true }).waitFor();
  await page.getByText("Section: resume", { exact: true }).waitFor();
  await page.getByText("Partial match", { exact: true }).waitFor();
  await page.screenshot({ path: `${output}/v2-desktop.png`, fullPage: true });
  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 812 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
    );
  }
  await page.screenshot({ path: `${output}/v2-mobile.png`, fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  status = 409;
  await open("pending");
  await page
    .getByRole("status")
    .filter({ hasText: "No completed result" })
    .waitFor();
  assert.equal(await page.locator(".evaluation-score").count(), 0);
  status = 200;
  await page.getByRole("button", { name: "Refresh result" }).click();
  await page.getByText("Relevant projects", { exact: true }).waitFor();
  for (const [code, message] of [
    [404, "No evaluation is available"],
    [403, "permission"],
    [500, "temporarily unavailable"],
    ["network", "connection"],
  ]) {
    status = code;
    await open(`error-${code}`);
    await page.getByRole("alert").filter({ hasText: message }).waitFor();
    assert.equal(await page.locator(".evaluation-score").count(), 0);
    assert.equal(
      await page.getByRole("button", { name: "Refresh result" }).isDisabled(),
      code === 403,
    );
    assert.equal(
      await page.getByLabel("Job ID", { exact: true }).inputValue(),
      `error-${code}`,
    );
  }
  status = 200;
  const started = new Promise((resolve) => {
    slowStarted = resolve;
  });
  await open("slow");
  await started;
  await page
    .getByRole("status")
    .filter({ hasText: "Loading evaluation" })
    .waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Refresh result" }).isDisabled(),
    true,
  );
  await page.getByLabel("Job ID", { exact: true }).fill("v2");
  await page.getByLabel("Job ID", { exact: true }).press("Enter");
  await page.getByText("Limited React evidence", { exact: true }).waitFor();
  releaseSlow();
  assert.equal(
    await page.getByText("OBSOLETE RESULT", { exact: true }).count(),
    0,
  );
  await page.goBack();
  await page.waitForURL("**/freelancer/evaluations/slow");
  await page.goForward();
  await page.getByText("Limited React evidence", { exact: true }).waitFor();
  releaseSlow?.();
  status = 401;
  signedIn = false;
  await page.getByRole("button", { name: "Refresh result" }).click();
  await page.waitForURL("**/auth/sign-in");
  assert.equal(await page.locator(".evaluation-score").count(), 0);
  signedIn = true;
  role = "ROLE_COMPANY";
  await open("v1");
  await page.waitForURL("**/jobs");
  role = "ROLE_APPLICANT";
  signedIn = false;
  await open("v1");
  await page.waitForURL("**/auth/sign-in");
  assert.deepEqual(errors, []);
  assert.deepEqual(
    unexpected,
    [],
    "Viewer must only GET applicant results, without creating evaluations or joining sockets",
  );
  console.log(
    JSON.stringify(
      {
        passed: [
          "inline by job ID + no session references + reload + isolated cards",
          "latest evaluation + 409 hides old result + refresh + collapse",
          "ID form + whitespace + keyboard",
          "V1 + reload",
          "V2 criteria + zero + citations",
          "375px/320px",
          "409 + refresh",
          "403/404/500/network",
          "loading + stale response + back/forward",
          "401 sign-in + role guards",
        ],
        screenshots: output,
      },
      null,
      2,
    ),
  );
} finally {
  releaseSlow?.();
  await browser.close();
}
