import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseJobFilters,
  serializeJobFilters,
  validateApplication,
  validateJobForm,
  resumeContentType,
  isJobExpired,
} from "./jobValidation.ts";
test("URL filters normalize pages, remove empty selections and reject invalid budget ranges", () => {
  const parsed = parseJobFilters(
    new URLSearchParams("pageNumber=0&categoryIds=1,2&skillIds=&budgetMin=0"),
  );
  assert.equal(parsed.filters.pageNumber, 1);
  assert.deepEqual(parsed.filters.categoryIds, [1, 2]);
  assert.equal(serializeJobFilters(parsed.filters).get("skillIds"), null);
  assert.equal(serializeJobFilters(parsed.filters).get("budgetMin"), "0");
  assert.ok(
    parseJobFilters(new URLSearchParams("budgetMin=10&budgetMax=1")).error,
  );
  assert.ok(parseJobFilters(new URLSearchParams("categoryIds=1,nope")).error);
});
test("job form converts numbers and local datetime to ISO, always sends skillsId, requires future deadline", () => {
  const form = {
    title: " A Job ",
    description: "Scope",
    requirements: "React",
    location: "Remote",
    budget: "0",
    currency: "VND",
    status: "OPEN",
    categoryId: "1",
    arrangementId: "2",
    skillsId: [],
    dueAt: "2027-12-01T10:30",
  };
  const valid = validateJobForm(form, 0);
  assert.deepEqual(valid.errors, {});
  assert.equal(valid.payload?.budget, 0);
  assert.equal(valid.payload?.categoryId, 1);
  assert.deepEqual(valid.payload?.skillsId, []);
  assert.equal(valid.payload?.dueAt, new Date(form.dueAt).toISOString());
  assert.ok(
    validateJobForm({
      ...form,
      budget: "Infinity",
      categoryId: "1.5",
      dueAt: "2000-01-01T00:00",
    }).errors.dueAt,
  );
  assert.ok(validateJobForm({ ...form, title: " " }).errors.title);
});
test("application requires nonempty letter and integer days, allows amount zero", () => {
  assert.deepEqual(
    validateApplication({
      coverLetter: "Hi",
      proposedRate: "0",
      estimatedDay: "1",
    }).errors,
    {},
  );
  assert.ok(
    validateApplication({
      coverLetter: " ",
      proposedRate: "-1",
      estimatedDay: "1.5",
    }).errors.estimatedDay,
  );
});
test("resume accepts only PDF/DOCX from 1 byte through 5 MiB with exact MIME", () => {
  assert.equal(
    resumeContentType({ name: "resume.PDF", size: 1, type: "" }),
    "application/pdf",
  );
  assert.equal(
    resumeContentType({ name: "resume.docx", size: 5 * 1024 * 1024, type: "" }),
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
  for (const file of [
    { name: "r.txt", size: 1, type: "text/plain" },
    { name: "r.pdf", size: 0, type: "" },
    { name: "r.pdf", size: 1.5, type: "" },
    { name: "r.pdf", size: Number.NaN, type: "" },
    { name: "r.pdf", size: 5 * 1024 * 1024 + 1, type: "" },
    { name: "r.pdf", size: 1, type: "text/plain" },
  ])
    assert.throws(() => resumeContentType(file));
  assert.equal(isJobExpired("invalid"), true);
  assert.equal(isJobExpired("2000-01-01T00:00:00Z"), true);
});
