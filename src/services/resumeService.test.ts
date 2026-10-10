import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { AxiosHeaders } from "axios";
import { api } from "./api.ts";
import {
  createResume,
  requestResumeUpload,
  uploadResumeFile,
  storageClient,
} from "./resumeService.ts";
const originalApi = api.defaults.adapter;
const originalStorage = storageClient.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalApi;
  storageClient.defaults.adapter = originalStorage;
});
test("resume upload requests exact metadata and storage PUT has MIME with no API credentials", async () => {
  const file = new File(["PDF"], "resume.pdf", { type: "application/pdf" });
  const urls: string[] = [];
  api.defaults.adapter = async (config) => {
    urls.push(config.url!);
    const input = JSON.parse(config.data);
    if (config.url === "/resume/upload-url") {
      assert.deepEqual(input, {
        fileName: "resume.pdf",
        contentType: "application/pdf",
        fileSize: 3,
      });
      return {
        config,
        data: {
          uploadUrl: "https://storage.example/signed",
          storageKey: "key",
          expiresAt: "2027-01-01",
        },
        status: 201,
        statusText: "",
        headers: new AxiosHeaders(),
      };
    }
    assert.deepEqual(input, { name: "resume.pdf", storageKey: "key" });
    return {
      config,
      data: {
        publicId: "resume-public",
        ingestionStatus: "PENDING",
        ingestionPublicId: "ingest",
      },
      status: 201,
      statusText: "",
      headers: new AxiosHeaders(),
    };
  };
  storageClient.defaults.adapter = async (config) => {
    assert.equal(config.method, "put");
    assert.equal(config.url, "https://storage.example/signed");
    assert.equal(config.headers.get("Authorization"), undefined);
    assert.equal(config.withCredentials, false);
    assert.equal(config.headers.get("Content-Type"), "application/pdf");
    assert.equal(config.data, file);
    return {
      config,
      data: "",
      status: 200,
      statusText: "",
      headers: new AxiosHeaders(),
    };
  };
  const upload = await requestResumeUpload(file);
  await uploadResumeFile(upload.uploadUrl, file);
  assert.equal(
    (await createResume(file.name, upload.storageKey)).publicId,
    "resume-public",
  );
  assert.deepEqual(urls, ["/resume/upload-url", "/resume"]);
});
test("invalid file is rejected before any request and each upload failure propagates without retry", async () => {
  let calls = 0;
  api.defaults.adapter = storageClient.defaults.adapter = async () => {
    calls++;
    throw new Error("unavailable");
  };
  await assert.rejects(requestResumeUpload(new File([], "resume.pdf")));
  assert.equal(calls, 0);
  const file = new File(["PDF"], "resume.pdf");
  await assert.rejects(requestResumeUpload(file));
  await assert.rejects(uploadResumeFile("https://storage.example", file));
  await assert.rejects(createResume("resume.pdf", "key"));
  assert.equal(calls, 3);
});

test("replace sends both required fields, delete accepts empty 204 and preview requests inline", async () => {
  const { updateResume, deleteResume, getResumeDownloadUrl } =
    await import("./resumeService.ts");
  const calls: string[] = [];
  api.defaults.adapter = async (config) => {
    calls.push(`${config.method} ${config.url}`);
    if (config.method === "patch")
      assert.deepEqual(JSON.parse(config.data), {
        name: "New CV",
        storageKey: "new-key",
      });
    if (config.method === "get")
      assert.deepEqual(config.params, { disposition: "inline" });
    return {
      config,
      data:
        config.method === "delete"
          ? ""
          : { downloadUrl: "https://storage.example/download" },
      status: config.method === "delete" ? 204 : 200,
      statusText: "",
      headers: new AxiosHeaders(),
    };
  };
  await updateResume("resume-id", "New CV", "new-key");
  await deleteResume("resume-id");
  assert.equal(
    await getResumeDownloadUrl("resume-id", "inline"),
    "https://storage.example/download",
  );
  assert.deepEqual(calls, [
    "patch /resume/resume-id",
    "delete /resume/resume-id",
    "get /resume/resume-id/download-url",
  ]);
});
