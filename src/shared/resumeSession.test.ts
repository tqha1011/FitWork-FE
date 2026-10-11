import assert from "node:assert/strict";
import { test } from "node:test";
import { registerSessionResume, registerSavedResume } from "./resumeSession.ts";

test("retry response wins over retained metadata and clears stale worker errors", () => {
  const old = {
    publicId: "resume",
    ingestionPublicId: "old",
    ingestionStatus: "FAILED" as const,
    name: "CV",
    storageKey: "key",
    contentType: "application/pdf",
    size: 10,
    revision: 1,
    connection: "connected" as const,
    state: {
      resumePublicId: "resume",
      ingestionPublicId: "old",
      status: "FAILED" as const,
      errorMessage: "old error",
      updatedAt: "2026-10-10T08:00:00Z",
    },
  };
  const next = registerSessionResume(
    {
      publicId: "resume",
      ingestionPublicId: "new",
      ingestionStatus: "PENDING",
    },
    old,
    old.revision,
  );
  assert.equal(next.ingestionPublicId, "new");
  assert.equal(next.ingestionStatus, "PENDING");
  assert.equal(next.state, undefined);
  assert.equal(next.revision, 2);
  assert.equal(next.name, "CV");
});
test("saved metadata preserves current worker state and known storage only for the same ingestion", () => {
  const previous = registerSessionResume(
    {
      publicId: "resume",
      ingestionPublicId: "ingest",
      ingestionStatus: "COMPLETED",
    },
    { name: "CV", storageKey: "key", contentType: "application/pdf", size: 10 },
  );
  previous.state = {
    resumePublicId: "resume",
    ingestionPublicId: "ingest",
    status: "COMPLETED",
    updatedAt: "2026-10-10T12:00:00Z",
  };
  const item = {
    publicId: "resume",
    fileName: "Saved CV",
    fileType: "pdf" as const,
    fileSize: 20,
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-02T00:00:00Z",
    ingestionPublicId: "ingest",
    ingestionStatus: "PROCESSING" as const,
  };
  const same = registerSavedResume(item, previous);
  assert.equal(same.name, "Saved CV");
  assert.equal(same.size, 20);
  assert.equal(same.storageKey, "key");
  assert.equal(same.ingestionStatus, "COMPLETED");
  assert.equal(same.revision, previous.revision);
  const changed = registerSavedResume(
    { ...item, ingestionPublicId: "next", ingestionStatus: "PENDING" },
    previous,
  );
  assert.equal(changed.storageKey, undefined);
  assert.equal(changed.state, undefined);
  assert.equal(changed.ingestionStatus, "PENDING");
  assert.equal(changed.revision, previous.revision + 1);
  const unprocessed = registerSavedResume({
    ...item,
    ingestionPublicId: null,
    ingestionStatus: null,
  });
  assert.equal(unprocessed.ingestionPublicId, null);
  assert.equal(unprocessed.ingestionStatus, null);
});

test("fresh HTTP completion advances stale live state for the same ingestion", () => {
  const previous = registerSessionResume(
    {
      publicId: "resume",
      ingestionPublicId: "ingest",
      ingestionStatus: "PROCESSING",
    },
    { name: "CV", storageKey: "key", contentType: "application/pdf", size: 10 },
  );
  const item = {
    publicId: "resume",
    fileName: "CV",
    fileType: "pdf" as const,
    fileSize: 10,
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-02T00:00:00Z",
    ingestionPublicId: "ingest",
    ingestionStatus: "COMPLETED" as const,
  };
  for (const status of ["PROCESSING", "FAILED"] as const) {
    previous.state = {
      resumePublicId: "resume",
      ingestionPublicId: "ingest",
      status,
      updatedAt: "2026-10-10T12:00:00Z",
      ...(status === "FAILED" ? { errorMessage: "Old failure" } : {}),
    };
    const refreshed = registerSavedResume(item, previous);
    assert.equal(refreshed.ingestionStatus, "COMPLETED");
    assert.equal(refreshed.state, undefined);
    assert.equal(refreshed.storageKey, "key");
    assert.equal(refreshed.confirmedIngestionStatus, "COMPLETED");
    const delayed = registerSavedResume(
      { ...item, ingestionStatus: "PROCESSING" },
      refreshed,
    );
    assert.equal(delayed.ingestionStatus, "COMPLETED");
    assert.equal(delayed.confirmedIngestionStatus, "COMPLETED");
  }
});
