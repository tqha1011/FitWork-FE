import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { AxiosHeaders } from "axios";
import { api } from "./api.ts";
import {
  createEvaluation,
  getEvaluation,
  getJobOwnerEvaluation,
} from "./evaluationService.ts";
const adapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = adapter;
});
test("company evaluation keeps the job-owner route with both public IDs", async () => {
  const controller = new AbortController();
  api.defaults.adapter = async (config) => {
    assert.equal(config.method, "get");
    assert.equal(
      config.url,
      "/applicant-evaluation/jobs/job%2Fpublic/evaluation%2Fpublic",
    );
    assert.equal(config.signal, controller.signal);
    return {
      config,
      data: {
        publicId: "evaluation/public",
        overallScore: 0,
        decisionSupportOnly: true,
      },
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
    };
  };
  assert.equal(
    (
      await getJobOwnerEvaluation(
        "job/public",
        "evaluation/public",
        controller.signal,
      )
    ).publicId,
    "evaluation/public",
  );
});
test("latest applicant evaluation uses the job ID without a body/query and forwards cancellation", async () => {
  const calls: string[] = [];
  const controller = new AbortController();
  api.defaults.adapter = async (config) => {
    calls.push(`${config.method} ${config.url}`);
    if (config.method === "get") {
      assert.equal(config.url, "/applicant-evaluation/job%2Fpublic");
      assert.equal(config.signal, controller.signal);
      assert.equal(config.params, undefined);
      assert.equal(config.data, undefined);
    }
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
  assert.equal(
    (await getEvaluation("job/public", controller.signal)).overallScore,
    0,
  );
  assert.deepEqual(calls, [
    "post /applicant-evaluation",
    "get /applicant-evaluation/job%2Fpublic",
  ]);
});
