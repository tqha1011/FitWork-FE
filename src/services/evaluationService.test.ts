import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { AxiosHeaders } from "axios";
import { api } from "./api.ts";
import { createEvaluation, getEvaluation } from "./evaluationService.ts";
const adapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = adapter;
});
test("evaluation uses direct response and separate applicant and job-owner routes", async () => {
  const calls: string[] = [];
  api.defaults.adapter = async (config) => {
    calls.push(`${config.method} ${config.url}`);
    if (config.method === "post")
      assert.deepEqual(JSON.parse(config.data), {
        resumePublicId: "resume",
        jobPublicId: "job",
      });
    return {
      config,
      data:
        config.method === "post"
          ? { publicId: "evaluation" }
          : { publicId: "evaluation", overallScore: 0 },
      status: 201,
      statusText: "",
      headers: new AxiosHeaders(),
    };
  };
  assert.equal(
    (await createEvaluation("resume", "job")).publicId,
    "evaluation",
  );
  assert.equal((await getEvaluation("evaluation")).overallScore, 0);
  await getEvaluation("evaluation", "job");
  assert.deepEqual(calls, [
    "post /applicant-evaluation",
    "get /applicant-evaluation/evaluation",
    "get /applicant-evaluation/jobs/job/evaluation",
  ]);
});
