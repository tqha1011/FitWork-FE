import assert from "node:assert/strict";
import { test } from "node:test";
import { registerSessionResume } from "./resumeSession.ts";

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
