import assert from "node:assert/strict";
import { test } from "node:test";
import { acceptProcessingState } from "./processingState.ts";

test("ingestion updates must match both IDs and cannot move backwards in time", () => {
  const reference = { publicId: "resume", ingestionPublicId: "current" };
  const state = {
    resumePublicId: "resume",
    ingestionPublicId: "current",
    status: "COMPLETED" as const,
    updatedAt: "2026-10-10T09:00:00+01:00",
  };
  assert.equal(acceptProcessingState(reference, undefined, state), true);
  assert.equal(
    acceptProcessingState(reference, state, {
      ...state,
      ingestionPublicId: "old",
    }),
    false,
  );
  assert.equal(
    acceptProcessingState(reference, state, {
      ...state,
      updatedAt: "2026-10-10T07:59:59Z",
    }),
    false,
  );
  assert.equal(
    acceptProcessingState(reference, state, { ...state, updatedAt: "invalid" }),
    false,
  );
});
test("evaluation zero is accepted, foreign IDs and stale terminal reversals are rejected", () => {
  const state = {
    evaluationPublicId: "evaluation",
    status: "COMPLETED" as const,
    overallScore: 0,
    updatedAt: "2026-10-10T08:00:00Z",
  };
  assert.equal(acceptProcessingState("evaluation", undefined, state), true);
  assert.equal(acceptProcessingState("foreign", undefined, state), false);
  assert.equal(
    acceptProcessingState("evaluation", state, {
      ...state,
      status: "PROCESSING",
    }),
    false,
  );
});
