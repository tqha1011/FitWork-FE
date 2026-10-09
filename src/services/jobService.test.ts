import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { AxiosError, AxiosHeaders } from "axios";
import { api } from "./api.ts";
import { clearAccessToken } from "./authSession.ts";
import {
  applyToJob,
  createJob,
  getAllApplications,
  getApplications,
  getReferences,
  searchJobs,
  updateApplicationStatus,
  updateJob,
} from "./jobService.ts";

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
  clearAccessToken();
});
const emptyPage = {
  items: [],
  totalPages: 0,
  pageNumber: 1,
  pageSize: 20,
  hasPrevious: false,
  hasNext: false,
};
test("search serializes comma IDs, omits unused filters and preserves zero budget and zero pages", async () => {
  api.defaults.adapter = async (config) => {
    assert.equal(config.url, "/job");
    assert.deepEqual(config.params, {
      pageNumber: 1,
      pageSize: 20,
      title: "React",
      categoryIds: "1,2",
      budgetMin: 0,
    });
    return {
      config,
      data: emptyPage,
      status: 200,
      statusText: "",
      headers: new AxiosHeaders(),
    };
  };
  assert.deepEqual(
    await searchJobs({
      pageNumber: 1,
      pageSize: 20,
      title: " React ",
      categoryIds: [1, 2],
      skillIds: [],
      budgetMin: 0,
    }),
    emptyPage,
  );
});
test("mutation URLs use resource-specific public IDs and handle empty create/update responses", async () => {
  const requests: { url: string | undefined; body: unknown }[] = [];
  api.defaults.adapter = async (config) => {
    requests.push({ url: config.url, body: JSON.parse(config.data) });
    return {
      config,
      data: "",
      status: 201,
      statusText: "",
      headers: new AxiosHeaders(),
    };
  };
  const input = {
    title: "Job",
    description: "Scope",
    requirements: "Skills",
    location: "Remote",
    budget: 0,
    currency: "VND" as const,
    status: "OPEN" as const,
    categoryId: 1,
    arrangementId: 2,
    skillsId: [],
    dueAt: "2027-12-01T00:00:00.000Z",
  };
  assert.equal(await createJob(input), undefined);
  assert.equal(await updateJob("job-id", { status: "CLOSED" }), undefined);
  await applyToJob("job-id", {
    coverLetter: "Hello",
    proposedRate: 0,
    estimatedDay: 1,
    resumePublicId: "resume-id",
  });
  await updateApplicationStatus("application-id", "ACCEPTED");
  assert.deepEqual(
    requests.map((r) => r.url),
    [
      "/job",
      "/job/job-id",
      "/job/job-id/apply",
      "/job/applicants/application-id/status",
    ],
  );
  assert.deepEqual(requests[0].body, input);
  assert.deepEqual(requests[2].body, {
    coverLetter: "Hello",
    proposedRate: 0,
    estimatedDay: 1,
    resumePublicId: "resume-id",
  });
});
test("all history pages are loaded so duplicates on later pages are discoverable", async () => {
  const pages: number[] = [];
  api.defaults.adapter = async (config) => {
    assert.equal(config.url, "/job/applied");
    const page = config.params.pageNumber;
    pages.push(page);
    return {
      config,
      data: {
        ...emptyPage,
        items: [{ jobPublicId: `job-${page}` }],
        pageNumber: page,
        totalPages: 3,
        hasNext: page < 3,
      },
      status: 200,
      statusText: "",
      headers: new AxiosHeaders(),
    };
  };
  assert.equal(
    (await getAllApplications()).find((item) => item.jobPublicId === "job-3")
      ?.jobPublicId,
    "job-3",
  );
  assert.deepEqual(pages, [1, 2, 3]);
  assert.equal((await getApplications(2)).pageNumber, 2);
});
test("incomplete history fails closed and mutations are never retried on 500", async () => {
  let calls = 0;
  api.defaults.adapter = async (config) => {
    calls++;
    throw new AxiosError("Failure", "ERR_BAD_RESPONSE", config, undefined, {
      config,
      data: {},
      status: 500,
      statusText: "",
      headers: new AxiosHeaders(),
    });
  };
  await assert.rejects(getAllApplications());
  await assert.rejects(
    applyToJob("job", {
      proposedRate: 1,
      estimatedDay: 1,
      coverLetter: "x",
      resumePublicId: "resume",
    }),
  );
  assert.equal(calls, 2);
});
test("references share one flight and cache, then logout cancels the flight and clears cached data", async () => {
  let calls = 0;
  api.defaults.adapter = async (config) => {
    calls++;
    assert.ok(
      ["/categories", "/skills", "/arrangements"].includes(config.url!),
    );
    await new Promise((resolve) => setTimeout(resolve, 5));
    return {
      config,
      data: [{ id: 1, name: "Real reference" }],
      status: 200,
      statusText: "",
      headers: new AxiosHeaders(),
    };
  };
  await Promise.all([getReferences(), getReferences()]);
  await getReferences();
  assert.equal(calls, 3);
  clearAccessToken();
  const pending = getReferences();
  await new Promise((resolve) => setTimeout(resolve, 1));
  clearAccessToken();
  await assert.rejects(pending);
  await getReferences();
  assert.equal(calls, 9);
});
