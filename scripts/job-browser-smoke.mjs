import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const base = process.env.JOB_UI_URL || "http://127.0.0.1:5173";
const output = process.env.JOB_QA_DIR || "/tmp/fitwork-job-qa";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH,
});
const checks = [];
const future = "2027-12-01T00:00:00.000Z";
const job = (id, title, currency = "VND", dueAt = future) => ({
  publicId: id,
  title,
  description: "Build a clear, accessible experience. ".repeat(12),
  budget: 1000000,
  currency,
  location: "Ho Chi Minh City",
  skills: [{ id: 2, name: "React" }],
  category: { id: 1, name: "Web Development" },
  arrangement: { id: 3, name: "Remote" },
  dueAt,
  totalApplicants: 2,
});
const jobs = [
  job("job-a", "Build a React dashboard", "USD"),
  job("job-b", "Design a useful workspace"),
  job("job-expired", "Expired Job", "VND", "2000-01-01T00:00:00Z"),
  job("job-duplicate", "Already applied on page three"),
];
const application = (id, jobId) => ({
  jobApplicantPublicId: id,
  jobPublicId: jobId,
  status: "PENDING",
  resumePublicId: "resume-existing",
  proposedRate: 0,
  estimatedDays: 1,
  appliedAt: "2026-10-09T03:00:00Z",
  matchingScore: 0,
});
async function setup(
  role = "freelancer",
  viewport = { width: 1440, height: 1000 },
) {
  const context = await browser.newContext({ viewport });
  const state = {
    role,
    historyFailure: 0,
    historyFailurePage: 1,
    historyFailureAfterApply: false,
    searchFailure: 0,
    applyFailure: 0,
    storageFailure: 0,
    resumeFailure: 0,
    uploadUrlFailure: 0,
    createFailure: 0,
    persistOnApplyFailure: false,
    applications: [],
    requests: [],
    creates: [],
    applyCalls: 0,
    storageCalls: 0,
    resumeCalls: 0,
    uploadUrlCalls: 0,
    searchCalls: [],
  };
  await context.route("http://localhost:3000/api/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const method = req.method();
    state.requests.push({ path, method, headers: req.headers() });
    const send = (data, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(data),
        headers: {
          "Access-Control-Allow-Origin": base,
          "Access-Control-Allow-Credentials": "true",
        },
      });
    if (path.includes("/auth/")) {
      if (!state.role) return send({ message: "unauthorized" }, 401);
      const token = `header.${Buffer.from(JSON.stringify({ sub: `user-${state.role}`, email: `${state.role}@example.com`, role: state.role === "client" ? "ROLE_COMPANY" : "ROLE_APPLICANT", exp: Math.floor(Date.now() / 1000) + 900 })).toString("base64url")}.signature`;
      return send({ accessToken: token, expiresIn: 900 });
    }
    assert.match(req.headers().authorization, /^Bearer /);
    if (path === "/api/categories")
      return send([
        { id: 1, name: "Web Development" },
        { id: 4, name: "Design" },
      ]);
    if (path === "/api/skills") return send([{ id: 2, name: "React" }]);
    if (path === "/api/arrangements") return send([{ id: 3, name: "Remote" }]);
    if (path === "/api/job/applied") {
      const number = Number(url.searchParams.get("pageNumber"));
      if (state.historyFailure && number === state.historyFailurePage)
        return send({ message: "history unavailable" }, state.historyFailure);
      const items =
        number === 1
          ? [...state.applications, application("old-a", "unavailable-job")]
          : number === 2
            ? [application("old-b", "other-job")]
            : [application("duplicate", "job-duplicate")];
      return send({
        items,
        pageNumber: number,
        pageSize: 100,
        totalPages: 3,
        hasPrevious: number > 1,
        hasNext: number < 3,
      });
    }
    if (path === "/api/job" && method === "GET") {
      const title = url.searchParams.get("title") || "";
      state.searchCalls.push(url.search);
      if (state.searchFailure) return send({}, state.searchFailure);
      if (title === "slow")
        await new Promise((resolve) => setTimeout(resolve, 700));
      const number = Number(url.searchParams.get("pageNumber"));
      const selected =
        number > 1
          ? []
          : title
            ? jobs.filter((item) =>
                item.title.toLowerCase().includes(title.toLowerCase()),
              )
            : jobs;
      return send({
        items: selected,
        pageNumber: number,
        pageSize: 20,
        totalPages: selected.length ? 1 : 0,
        hasPrevious: number > 1,
        hasNext: false,
      });
    }
    if (path === "/api/job" && method === "POST") {
      state.creates.push(req.postDataJSON());
      if (state.createFailure) return send({}, state.createFailure);
      return route.fulfill({ status: 201, body: "" });
    }
    if (path === "/api/resume/upload-url") {
      state.uploadUrlCalls++;
      if (state.uploadUrlFailure) return send({}, state.uploadUrlFailure);
      assert.deepEqual(req.postDataJSON(), {
        fileName: "resume.pdf",
        contentType: "application/pdf",
        fileSize: 9,
      });
      return send(
        {
          uploadUrl: "https://storage.example/resume-signed",
          storageKey: "uploaded-key",
          expiresAt: future,
        },
        201,
      );
    }
    if (path === "/api/resume") {
      state.resumeCalls++;
      if (state.resumeFailure) return send({}, state.resumeFailure);
      assert.deepEqual(req.postDataJSON(), {
        name: "resume.pdf",
        storageKey: "uploaded-key",
      });
      return send(
        {
          publicId: "resume-new",
          ingestionPublicId: "ingestion-new",
          ingestionStatus: "PENDING",
        },
        201,
      );
    }
    if (path.endsWith("/apply")) {
      state.applyCalls++;
      const body = req.postDataJSON();
      assert.deepEqual(body, {
        coverLetter: "I can build this Job.",
        proposedRate: 0,
        estimatedDay: 1,
        resumePublicId: "resume-new",
      });
      const jobId = path.split("/").at(-2);
      if (!state.applyFailure || state.persistOnApplyFailure)
        state.applications.push(application("new-application", jobId));
      if (state.historyFailureAfterApply) state.historyFailure = 500;
      if (state.applyFailure === "network") return route.abort("failed");
      if (state.applyFailure === "timeout") return;
      if (state.applyFailure) return send({}, state.applyFailure);
      return send({ message: "Applied successfully" }, 201);
    }
    throw new Error(`Unexpected request: ${method} ${path}`);
  });
  await context.route("https://storage.example/**", async (route) => {
    const req = route.request();
    state.storageCalls++;
    assert.equal(req.method(), "PUT");
    assert.equal(req.headers().authorization, undefined);
    assert.equal(req.headers().cookie, undefined);
    assert.equal(req.headers()["content-type"], "application/pdf");
    return route.fulfill({ status: state.storageFailure || 200, body: "" });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  return { context, page, state };
}
async function openApply(page, title = "Build a React dashboard") {
  await page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) })
    .getByRole("button", { name: "Apply", exact: true })
    .click();
  await page.getByLabel("Cover letter").fill("I can build this Job.");
  await page.getByLabel(/^Proposed amount/).fill("0");
  await page.getByLabel("Estimated days").fill("1");
  await page.getByLabel("Resume (PDF or DOCX)", { exact: true }).setInputFiles({
    name: "resume.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-test"),
  });
}
async function ready(page) {
  await page
    .getByRole("heading", { name: "Build a React dashboard", exact: true })
    .waitFor();
  await page
    .locator("article")
    .first()
    .getByRole("button", { name: "Apply", exact: true })
    .waitFor({ state: "visible" });
  await page.waitForFunction(() =>
    [...document.querySelectorAll("article button")].some(
      (button) => button.textContent === "Apply" && !button.disabled,
    ),
  );
}
async function screenshot(page, name, fullPage = true) {
  if (fullPage) await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `${output}/${name}`,
    fullPage,
    animations: "disabled",
  });
}
try {
  {
    const { page, context } = await setup(null);
    await page.goto(`${base}/jobs`);
    await page.waitForURL("**/auth/sign-in");
    checks.push("signed-out Job guard");
    await context.close();
  }
  {
    const { page, context, state } = await setup();
    await page.goto(`${base}/jobs`);
    await ready(page);
    assert.equal(
      await page
        .locator("article")
        .filter({ hasText: "Already applied on page three" })
        .getByRole("button")
        .isDisabled(),
      true,
    );
    assert.equal(
      await page
        .locator("article")
        .filter({ hasText: "Expired Job" })
        .getByRole("button")
        .isDisabled(),
      true,
    );
    await page.goto(`${base}/client/jobs/new`);
    await page.waitForURL("**/jobs");
    await ready(page);
    await page.getByLabel("Job title", { exact: true }).fill("React");
    await page.waitForURL("**/jobs?title=React");
    await page.getByLabel("Web Development", { exact: true }).click();
    await page.waitForURL(/categoryIds=1/);
    await page.waitForFunction(
      () => document.querySelector('input[type="checkbox"]').checked,
    );
    await page.goBack();
    await page.waitForURL("**/jobs?title=React");
    assert.equal(
      await page.getByLabel("Job title", { exact: true }).inputValue(),
      "React",
    );
    await page.goForward();
    assert.equal(
      await page.getByLabel("Web Development", { exact: true }).isChecked(),
      true,
    );
    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await page.waitForURL("**/jobs");
    await ready(page);
    await page.getByLabel("Job title", { exact: true }).fill("slow");
    await page.waitForURL("**/jobs?title=slow");
    await page.getByLabel("Job title", { exact: true }).fill("React");
    await page.waitForURL("**/jobs?title=React");
    await page.waitForTimeout(750);
    assert.equal(
      await page
        .getByRole("heading", { name: "Build a React dashboard", exact: true })
        .count(),
      1,
    );
    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await ready(page);
    await screenshot(page, "jobs-desktop.png");
    for (const width of [768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      await screenshot(page, `jobs-${width}.png`);
    }
    await openApply(page);
    assert.match(
      await page
        .getByLabel(/^Proposed amount/)
        .getAttribute("aria-describedby"),
      /help/,
    );
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(() => !!document.activeElement.closest("dialog")),
        true,
      );
    }
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
    assert.equal(
      await page.evaluate(() => document.activeElement.textContent),
      "Apply",
    );
    await openApply(page);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await screenshot(page, "apply-320.png", false);
    await page
      .getByRole("button", { name: "Submit application", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Application submitted", exact: true })
      .waitFor();
    await page.getByText("Application ID: new-application").waitFor();
    assert.equal(state.applyCalls, 1);
    assert.equal(state.storageCalls, 1);
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page
      .getByRole("link", { name: "My Applications", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "My Applications", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByText("Job information unavailable", { exact: true })
        .count(),
      2,
    );
    assert.equal(
      (await page.locator("dd").filter({ hasText: /^0$/ }).count()) > 0,
      true,
    );
    await screenshot(page, "applications-320.png");
    checks.push(
      "role guard, later-page duplicate, expiry, URL/back-forward/debounce/stale search, desktop/tablet/390/320, keyboard focus, upload/apply/history",
    );
    await context.close();
  }
  for (const status of [400, 403, 404, 500, "network", "timeout"]) {
    const { page, context, state } = await setup();
    if (status === "timeout") page.setDefaultTimeout(22000);
    await page.goto(`${base}/jobs`);
    await ready(page);
    await openApply(page);
    state.applyFailure = status;
    await page
      .getByRole("button", { name: "Submit application", exact: true })
      .click();
    await page.getByRole("alert").first().waitFor();
    await page.waitForFunction(
      () => !document.querySelector("button[type=submit]").disabled,
    );
    assert.equal(
      await page.getByLabel("Cover letter").inputValue(),
      "I can build this Job.",
    );
    assert.equal(state.applyCalls, 1);
    state.applyFailure = 0;
    await page
      .getByRole("button", { name: "Submit application", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Application submitted", exact: true })
      .waitFor();
    assert.equal(state.storageCalls, 1);
    assert.equal(state.resumeCalls, 1);
    checks.push(`apply ${status} retains input and resume; manual retry`);
    await context.close();
  }
  {
    const { page, context, state } = await setup();
    state.applyFailure = 500;
    state.persistOnApplyFailure = true;
    await page.goto(`${base}/jobs`);
    await ready(page);
    await openApply(page);
    await page
      .getByRole("button", { name: "Submit application", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Application submitted", exact: true })
      .waitFor();
    assert.equal(state.applyCalls, 1);
    checks.push(
      "uncertain apply reconciles successful submission without resend",
    );
    await context.close();
  }
  {
    const { page, context, state } = await setup();
    await page.goto(`${base}/jobs`);
    await ready(page);
    await openApply(page);
    state.historyFailureAfterApply = true;
    await page
      .getByRole("button", { name: "Submit application", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Application submitted", exact: true })
      .waitFor();
    await page.getByRole("alert").first().waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Submit application", exact: true })
        .count(),
      0,
    );
    state.historyFailure = 0;
    state.historyFailureAfterApply = false;
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Retry", exact: true })
      .click();
    await page.getByText("Application ID: new-application").waitFor();
    assert.equal(state.applyCalls, 1);
    checks.push(
      "201 apply followed by failed history sync: confirmed success and history-only retry",
    );
    await context.close();
  }
  {
    const { page, context, state } = await setup();
    await page.goto(`${base}/jobs`);
    await ready(page);
    await openApply(page);
    state.applyFailure = 500;
    state.persistOnApplyFailure = true;
    state.historyFailureAfterApply = true;
    state.historyFailurePage = 3;
    await page
      .getByRole("button", { name: "Submit application", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Retry", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Submit application", exact: true })
        .isDisabled(),
      true,
    );
    state.historyFailure = 0;
    state.historyFailureAfterApply = false;
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Retry", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Application submitted", exact: true })
      .waitFor();
    assert.equal(state.applyCalls, 1);
    checks.push(
      "uncertain apply plus later-page history failure: locked until full recovery, no resend",
    );
    await context.close();
  }
  {
    const { page, context, state } = await setup();
    state.searchFailure = 500;
    await page.goto(`${base}/jobs`);
    await page.getByRole("alert").first().waitFor();
    state.searchFailure = 0;
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await ready(page);
    await page.goto(`${base}/jobs?title=missing`);
    await page
      .getByRole("heading", { name: "No Jobs found", exact: true })
      .waitFor();
    assert.equal(
      await page.getByText("Page 1 of 0", { exact: true }).count(),
      0,
    );
    await page.goto(`${base}/jobs?pageNumber=9`);
    await page
      .getByRole("heading", { name: "This page has no Jobs", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Back to first page", exact: true })
      .click();
    await page.waitForURL("**/jobs");
    await ready(page);
    checks.push(
      "search failure/retry, empty zero-page result and explicit out-of-range recovery",
    );
    await context.close();
  }
  {
    const { page, context, state } = await setup();
    state.historyFailure = 500;
    state.historyFailurePage = 3;
    await page.goto(`${base}/jobs`);
    await page.getByRole("button", { name: "Retry", exact: true }).waitFor();
    assert.equal(
      await page.locator("article").first().getByRole("button").isDisabled(),
      true,
    );
    state.historyFailure = 0;
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await ready(page);
    checks.push("history failure disables Apply until retry succeeds");
    await context.close();
  }
  for (const failure of [
    "uploadUrlFailure",
    "storageFailure",
    "resumeFailure",
  ]) {
    const { page, context, state } = await setup();
    state[failure] = 500;
    await page.goto(`${base}/jobs`);
    await ready(page);
    await openApply(page);
    await page
      .getByRole("button", { name: "Submit application", exact: true })
      .click();
    await page.getByRole("alert").first().waitFor();
    assert.equal(state.applyCalls, 0);
    assert.equal(
      await page.getByLabel("Cover letter").inputValue(),
      "I can build this Job.",
    );
    if (failure === "resumeFailure") {
      assert.equal(
        await page
          .getByRole("button", { name: "Submit application", exact: true })
          .isDisabled(),
        true,
      );
      assert.equal(state.resumeCalls, 1);
      checks.push(
        "resume registration 500: preserve input and block duplicate registration",
      );
      await context.close();
      continue;
    }
    state[failure] = 0;
    await page
      .getByRole("button", { name: "Submit application", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Application submitted", exact: true })
      .waitFor();
    checks.push(`${failure}: step error, input retention and explicit retry`);
    await context.close();
  }
  {
    const { page, context, state } = await setup("client");
    await page.goto(`${base}/freelancer/applications`);
    await page.waitForURL("**/jobs");
    for (const status of ["OPEN", "CLOSED"]) {
      await page.goto(`${base}/client/jobs/new`);
      await page.getByLabel("Job title", { exact: true }).fill("Real new Job");
      await page.getByLabel("Description", { exact: true }).fill("Scope");
      await page.getByLabel("Requirements", { exact: true }).fill("React");
      await page.getByLabel("Category", { exact: true }).selectOption("1");
      await page
        .getByLabel("Work arrangement", { exact: true })
        .selectOption("3");
      await page.getByLabel("Location", { exact: true }).fill("Remote");
      await page.getByLabel("Budget", { exact: true }).fill("0");
      await page
        .getByLabel("Application deadline", { exact: true })
        .fill("2027-12-01T10:30");
      await page.getByLabel("Job status", { exact: true }).selectOption(status);
      if (status === "OPEN") {
        for (const width of [768, 390, 320]) {
          await page.setViewportSize({ width, height: 1000 });
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            true,
          );
          await screenshot(page, `create-job-${width}.png`);
        }
        await page.setViewportSize({ width: 1440, height: 1000 });
      }
      const submit = page.getByRole("button", {
        name: status === "OPEN" ? "Publish Job" : "Create closed job",
        exact: true,
      });
      state.createFailure = 500;
      await submit.click();
      await page.getByRole("alert").first().waitFor();
      assert.equal(
        await page.getByLabel("Job title", { exact: true }).inputValue(),
        "Real new Job",
      );
      state.createFailure = 0;
      await submit.click();
      await page.waitForURL("**/jobs");
      const sent = state.creates.at(-1);
      assert.equal(Object.keys(sent).length, 11);
      assert.deepEqual(sent.skillsId, []);
      assert.equal(sent.status, status);
      assert.equal(sent.budget, 0);
      assert.match(sent.dueAt, /Z$/);
    }
    checks.push(
      "Client guard and OPEN/CLOSED creation: eleven fields, empty response, no inferred ID, 500 retention",
    );
    await page.goto(`${base}/account`);
    await page
      .getByRole("heading", { name: "You’re signed in.", exact: true })
      .waitFor();
    assert.equal(
      await page.getByRole("button", { name: "Sign out", exact: true }).count(),
      1,
    );
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.waitForURL("**/auth/sign-in");
    checks.push("shared account page and shell logout");
    await context.close();
  }
  console.log(
    JSON.stringify(
      { passed: checks.length, checks, screenshots: output },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
