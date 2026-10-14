import assert from "node:assert/strict";
import { test } from "node:test";
import { AxiosError, AxiosHeaders } from "axios";
import { jobErrorMessage, isUncertainMutation } from "./jobErrorMessage.ts";
function httpError(status: number, headers = new AxiosHeaders()): AxiosError {
  return new AxiosError("server", "ERR_BAD_RESPONSE", undefined, undefined, {
    status,
    statusText: "",
    data: {},
    headers,
    config: { headers: new AxiosHeaders() },
  });
}
test("HTTP status defines the error without displaying request diagnostics", () => {
  assert.match(jobErrorMessage(httpError(400)), /values were not accepted/);
  assert.match(jobErrorMessage(httpError(403)), /permission/);
  assert.match(jobErrorMessage(httpError(404)), /unavailable/);
  assert.match(jobErrorMessage(httpError(500)), /temporarily unavailable/);
  assert.equal(
    jobErrorMessage(
      httpError(500, new AxiosHeaders({ "X-Request-ID": "request-123" })),
    ),
    jobErrorMessage(httpError(500)),
  );
});
test("network errors, timeout and 500 mutations are uncertain while explicit rejections are not", () => {
  for (const error of [
    new AxiosError("network", "ERR_NETWORK"),
    new AxiosError("timeout", "ECONNABORTED"),
    httpError(500),
  ]) {
    assert.equal(isUncertainMutation(error), true);
    assert.match(jobErrorMessage(error, true), /may have succeeded/);
  }
  for (const status of [400, 403, 404])
    assert.equal(isUncertainMutation(httpError(status)), false);
});
