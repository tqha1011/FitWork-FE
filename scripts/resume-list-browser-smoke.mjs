import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const base = process.env.JOB_UI_URL || "http://127.0.0.1:5173";
const output = process.env.RESUME_LIST_QA_DIR || "/tmp/fitwork-resume-list-qa";
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
const pdfId = "7867f344-036c-58a1-92f9-296c1385357d";
const docxId = "84ded580-bc23-45ae-a6c9-a6c931be6e7e";
const pdf = {
  publicId: pdfId,
  fileName: "Backend CV",
  fileType: "pdf",
  fileSize: 204800,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-02T00:00:00Z",
  ingestionPublicId: null,
  ingestionStatus: null,
};
const docx = {
  ...pdf,
  publicId: docxId,
  fileName: "Previous DOCX",
  fileType: "docx",
  ingestionStatus: "FAILED",
  ingestionPublicId: "dfe43cc1-45dc-445c-b55e-e49b90371235",
};
let listStatus = 200;
let detailStatus = 200;
let allEmpty = false;
let deleted = false;
let downloads = 0;
let listRequests = 0;
let detailRequests = 0;
let releaseSlow;
let startedSlow;
let slow = false;
const errors = [];
const unexpected = [];
page.on("pageerror", (error) => errors.push(error.message));
await context.route("http://localhost:3000/**", async (route) => {
  const req = route.request();
  const url = new URL(req.url());
  const send = (data, status = 200) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: status === 204 ? "" : JSON.stringify(data),
    });
  if (url.pathname === "/api/auth/refresh") {
    const token = `header.${Buffer.from(JSON.stringify({ sub: "applicant", email: "applicant@example.com", role: "ROLE_APPLICANT", exp: Math.floor(Date.now() / 1000) + 900 })).toString("base64url")}.signature`;
    return send({ accessToken: token, expiresIn: 900 });
  }
  if (url.pathname.startsWith("/socket.io")) return route.abort("failed");
  assert.match(req.headers().authorization, /^Bearer /);
  if (
    ["/api/categories", "/api/skills", "/api/arrangements"].includes(
      url.pathname,
    )
  )
    return send([]);
  if (url.pathname === "/api/job/applied")
    return send({
      items: [],
      totalPages: 0,
      pageNumber: 1,
      pageSize: 100,
      hasPrevious: false,
      hasNext: false,
    });
  if (url.pathname === "/api/resume" && req.method() === "GET") {
    listRequests++;
    assert.equal(req.postData(), null);
    assert.deepEqual([...url.searchParams.keys()].sort(), [
      "pageNumber",
      "pageSize",
    ]);
    const pageNumber = Number(url.searchParams.get("pageNumber"));
    const pageSize = Number(url.searchParams.get("pageSize"));
    assert.ok(Number.isInteger(pageNumber) && pageNumber >= 1);
    assert.ok(Number.isInteger(pageSize) && pageSize >= 1 && pageSize <= 100);
    if (slow) {
      startedSlow?.();
      await new Promise((resolve) => {
        releaseSlow = resolve;
      });
    }
    if (listStatus === "network") return route.abort("failed");
    if (listStatus !== 200)
      return send({ message: "List unavailable" }, listStatus);
    return send({
      items: allEmpty
        ? []
        : pageNumber === 1
          ? deleted
            ? []
            : [pdf]
          : pageNumber === 2
            ? [docx]
            : [],
      totalPages: allEmpty ? 0 : 2,
      pageNumber,
      pageSize,
      hasPrevious: pageNumber > 1,
      hasNext: pageNumber < 2,
    });
  }
  if (url.pathname === `/api/resume/${pdfId}` && req.method() === "GET") {
    detailRequests++;
    assert.equal(url.search, "");
    assert.equal(req.postData(), null);
    if (detailStatus === "network") return route.abort("failed");
    if (detailStatus !== 200)
      return send({ message: "Detail unavailable" }, detailStatus);
    return send({ ...pdf, fileName: "Fresh backend CV", fileSize: 409600 });
  }
  if (url.pathname.endsWith("/download-url")) {
    downloads++;
    assert.ok(
      ["inline", "attachment"].includes(url.searchParams.get("disposition")),
    );
    return send({
      downloadUrl: `https://storage.example/preview-${downloads}.pdf`,
    });
  }
  if (url.pathname === `/api/resume/${pdfId}` && req.method() === "DELETE") {
    deleted = true;
    return send(undefined, 204);
  }
  unexpected.push(`${req.method()} ${url.pathname}`);
  return send({ message: "Unexpected request" }, 500);
});
await context.route("https://storage.example/**", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/pdf",
    body: "%PDF-1.4\nexample",
  }),
);
try {
  await page.goto(`${base}/freelancer/resumes`);
  await page
    .getByRole("heading", { name: "Backend CV", exact: true })
    .waitFor();
  assert.equal(
    listRequests,
    1,
    "Existing CVs must load from the backend on page entry",
  );
  await page.getByText("Not processed yet", { exact: true }).waitFor();
  await page.getByText("PDF · 200.0 KB", { exact: true }).waitFor();
  assert.equal(
    await page
      .getByText("Resumes available in this session", { exact: true })
      .count(),
    0,
  );
  await page.reload();
  await page
    .getByRole("heading", { name: "Backend CV", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "View details", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("heading", { name: "Fresh backend CV", exact: true })
    .waitFor();
  await dialog.getByText("PDF · 400.0 KB", { exact: true }).waitFor();
  assert.equal(detailRequests, 1);
  await page.screenshot({
    path: `${output}/details-desktop.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 812 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
  );
  await page.screenshot({
    path: `${output}/details-mobile.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await dialog.getByRole("button", { name: "Preview", exact: true }).click();
  await page.locator("iframe").waitFor();
  assert.match(
    await page.locator("iframe").getAttribute("src"),
    /^https:\/\/storage\.example\/preview-1/,
  );
  await page
    .getByRole("button", { name: "Close preview", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Preview", exact: true })
    .first()
    .click();
  await page.locator("iframe").waitFor();
  assert.equal(downloads, 2, "Each preview needs a new signed URL");
  await page
    .getByRole("button", { name: "Close preview", exact: true })
    .click();
  // Detail and list failures preserve an explicit retry path.
  for (const status of [400, 404, 500, "network"]) {
    detailStatus = status;
    await page
      .getByRole("button", { name: "View details", exact: true })
      .click();
    await dialog.getByRole("alert").waitFor();
    detailStatus = 200;
    await dialog.getByRole("button", { name: "Retry", exact: true }).click();
    await dialog
      .getByRole("heading", { name: "Fresh backend CV", exact: true })
      .waitFor();
    await dialog
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
  }
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page
    .getByRole("heading", { name: "Previous DOCX", exact: true })
    .waitFor();
  assert.match(page.url(), /pageNumber=2/);
  await page.getByText("Reading failed", { exact: true }).waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Preview", exact: true }).count(),
    0,
    "DOCX uses download rather than an unsupported browser preview",
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Retry reading", exact: true })
      .count(),
    0,
    "Recovered metadata does not supply a storage key for PATCH retries",
  );
  await page.goBack();
  await page
    .getByRole("heading", { name: "Backend CV", exact: true })
    .waitFor();
  await page.goto(`${base}/freelancer/resumes?pageNumber=9&pageSize=100`);
  await page
    .getByRole("heading", { name: "No resumes on this page", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "First page", exact: true }).click();
  await page
    .getByRole("heading", { name: "Backend CV", exact: true })
    .waitFor();
  for (const status of [400, 500, "network"]) {
    listStatus = status;
    await page.reload();
    await page.getByRole("alert").waitFor();
    assert.equal(
      await page.locator(".resume-card").count(),
      0,
      "A failed list is not an empty or stale saved collection",
    );
    listStatus = 200;
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await page
      .getByRole("heading", { name: "Backend CV", exact: true })
      .waitFor();
  }
  await page.goto(`${base}/freelancer/resumes?pageNumber=invalid&pageSize=101`);
  await page
    .getByRole("heading", { name: "Backend CV", exact: true })
    .waitFor();
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
    path: `${output}/resumes-mobile.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: `${output}/resumes-desktop.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Delete Backend CV", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Delete resume", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "No resumes on this page", exact: true })
    .waitFor();
  allEmpty = true;
  await page.reload();
  await page
    .getByRole("heading", {
      name: "Your next opportunity starts with your CV",
      exact: true,
    })
    .waitFor();
  slow = true;
  const started = new Promise((resolve) => {
    startedSlow = resolve;
  });
  await page.reload();
  await started;
  await page
    .getByRole("status")
    .filter({ hasText: "Loading resumes" })
    .waitFor();
  await page.getByRole("link", { name: "My Evaluations", exact: true }).click();
  releaseSlow();
  await page
    .getByRole("heading", { name: "My Evaluations", exact: true })
    .waitFor();
  assert.equal(await page.locator(".resume-card").count(), 0);
  assert.deepEqual(errors, []);
  assert.deepEqual(unexpected, []);
  console.log(
    JSON.stringify(
      {
        passed: [
          "saved list + reload + null ingestion",
          "detail + fresh preview + retry",
          "pagination + back + empty/out of range",
          "400/500/network + retry",
          "pagination normalization + 375px/320px",
          "delete reconciliation + loading/unmount",
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
