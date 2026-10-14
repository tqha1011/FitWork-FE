import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import type { InternalAxiosRequestConfig } from "axios";
import { AxiosHeaders, AxiosError } from "axios";
import { api, refreshAccessToken } from "./api.ts";
import * as auth from "./authService.ts";
import {
  clearAccessToken,
  getAuthSession,
  getSessionGeneration,
} from "./authSession.ts";
import { getEvaluation } from "./evaluationService.ts";

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
  clearAccessToken();
});
function token(role = "ROLE_COMPANY", deadline = Date.now() + 3600000) {
  return `header.${Buffer.from(JSON.stringify({ sub: role, email: "demo@example.com", role, exp: Math.floor(Date.now() / 1000) + 900, demoSessionId: "workspace", demoExpiresAt: deadline, demoGeneration: role === "ROLE_COMPANY" ? 0 : 1 })).toString("base64url")}.signature`;
}
const response = (
  config: InternalAxiosRequestConfig,
  data: unknown,
  status = 200,
) => ({ config, data, status, statusText: "", headers: new AxiosHeaders() });

test("demo starts as company with credentials and preserves workspace claims", async () => {
  assert.equal(typeof auth.startDemo, "function");
  api.defaults.adapter = async (config) => {
    assert.equal(config.url, "/auth/demo");
    assert.equal(config.withCredentials, true);
    assert.equal(config.headers.get("Authorization"), undefined);
    assert.deepEqual(JSON.parse(config.data), { userType: "COMPANY" });
    return response(config, { accessToken: token(), expiresIn: 900 }, 201);
  };
  await auth.startDemo();
  assert.equal(getAuthSession()?.demo?.sessionId, "workspace");
  assert.equal(getAuthSession()?.demo?.generation, 0);
  assert.equal(getAuthSession()?.user.role, "client");
});

test("switch waits for refresh, blocks further refresh, cancels old responses and sends refreshed bearer", async () => {
  assert.equal(typeof auth.switchDemoRole, "function");
  let finishRefresh: (() => void) | undefined;
  let finishSwitch: (() => void) | undefined;
  let finishRead: (() => void) | undefined;
  let refreshes = 0;
  const refreshed = token("ROLE_COMPANY", Date.now() + 3500000);
  api.defaults.adapter = async (config) => {
    if (config.url === "/auth/demo")
      return response(config, { accessToken: token(), expiresIn: 900 });
    if (config.url === "/auth/refresh") {
      refreshes++;
      await new Promise<void>((resolve) => {
        finishRefresh = resolve;
      });
      return response(config, { accessToken: refreshed, expiresIn: 900 });
    }
    if (config.url === "/auth/demo/switch") {
      assert.equal(config.headers.get("Authorization"), `Bearer ${refreshed}`);
      assert.deepEqual(JSON.parse(config.data), { userType: "APPLICANT" });
      await new Promise<void>((resolve) => {
        finishSwitch = resolve;
      });
      return response(config, {
        accessToken: token("ROLE_APPLICANT"),
        expiresIn: 900,
      });
    }
    await new Promise<void>((resolve) => {
      finishRead = resolve;
    });
    return response(config, { old: true });
  };
  await auth.startDemo();
  const oldGeneration = getSessionGeneration();
  const read = api.get("/demo/session").then(
    () => "accepted",
    () => "cancelled",
  );
  const refresh = refreshAccessToken();
  while (!finishRefresh || !finishRead)
    await new Promise((resolve) => setTimeout(resolve, 1));
  const switching = auth.switchDemoRole("APPLICANT");
  assert.equal(getSessionGeneration(), oldGeneration);
  finishRefresh();
  await refresh;
  while (!finishSwitch) await new Promise((resolve) => setTimeout(resolve, 1));
  await assert.rejects(refreshAccessToken());
  finishRead();
  assert.equal(await read, "cancelled");
  finishSwitch();
  await switching;
  assert.equal(refreshes, 1);
  assert.equal(getAuthSession()?.user.role, "freelancer");
  assert.equal(getAuthSession()?.demo?.sessionId, "workspace");
});

test("sample selection is explicit even when latest is processing", async () => {
  api.defaults.adapter = async (config) => {
    assert.equal(config.params?.evaluationPublicId, "sample-id");
    return response(config, {
      publicId: "sample-id",
      source: "SAMPLE",
      overallScore: 0,
    });
  };
  assert.equal(
    (await getEvaluation("job", undefined, "sample-id")).publicId,
    "sample-id",
  );
});

test("expired workspace never refreshes or sends a protected request", async (t) => {
  assert.equal(typeof auth.startDemo, "function");
  let now = Date.now();
  t.mock.method(Date, "now", () => now);
  let calls = 0;
  api.defaults.adapter = async (config) => {
    calls++;
    return response(config, {
      accessToken: token("ROLE_COMPANY", now + 1000),
      expiresIn: 900,
    });
  };
  await auth.startDemo();
  now += 2000;
  await assert.rejects(api.get("/demo/session"));
  await assert.rejects(refreshAccessToken());
  assert.equal(calls, 1);
  assert.equal(getAuthSession(), null);
});

test("a refused switch retains the current workspace and can be retried", async () => {
  assert.equal(typeof auth.switchDemoRole, "function");
  api.defaults.adapter = async (config) => {
    if (config.url === "/auth/demo/switch")
      throw new AxiosError(
        "Unavailable",
        "ERR_BAD_RESPONSE",
        config,
        undefined,
        response(config, {}, 503),
      );
    return response(config, { accessToken: token(), expiresIn: 900 });
  };
  await auth.startDemo();
  await assert.rejects(auth.switchDemoRole("APPLICANT"));
  assert.equal(getAuthSession()?.user.role, "client");
  await refreshAccessToken();
});

test("a switch reserves the refresh barrier synchronously before a new refresh can start", async () => {
  let refreshes = 0;
  api.defaults.adapter = async (config) => {
    if (config.url === "/auth/refresh") refreshes++;
    return response(config, {
      accessToken: token(
        config.url === "/auth/demo/switch" ? "ROLE_APPLICANT" : "ROLE_COMPANY",
      ),
      expiresIn: 900,
    });
  };
  await auth.startDemo();
  const switching = auth.switchDemoRole("APPLICANT");
  await assert.rejects(refreshAccessToken());
  await switching;
  assert.equal(refreshes, 0);
  await refreshAccessToken();
  assert.equal(refreshes, 1, "Refresh resumes after switch");
});

test("immediate sign-in after logout retains logout bearer and the later sign-in succeeds", async () => {
  let logoutBearer: unknown;
  let loginSent = false;
  api.defaults.adapter = async (config) => {
    if (config.url === "/auth/logout") {
      logoutBearer = config.headers.get("Authorization");
      return response(config, "", 204);
    }
    if (config.url === "/auth/login") loginSent = true;
    return response(config, { accessToken: token(), expiresIn: 900 });
  };
  await auth.startDemo();
  const bearer = getAuthSession()?.accessToken;
  const ending = auth.logout();
  const signingIn = auth.login({
    email: "new@example.com",
    password: "password",
  });
  await Promise.all([ending, signingIn]);
  assert.equal(logoutBearer, `Bearer ${bearer}`);
  assert.equal(loginSent, true);
  assert.ok(getAuthSession());
});

test("logout immediately after role switch clears the switched local session", async () => {
  api.defaults.adapter = async (config) =>
    response(
      config,
      config.url === "/auth/logout"
        ? ""
        : {
            accessToken: token(
              config.url === "/auth/demo/switch"
                ? "ROLE_APPLICANT"
                : "ROLE_COMPANY",
            ),
            expiresIn: 900,
          },
      config.url === "/auth/logout" ? 204 : 200,
    );
  await auth.startDemo();
  const switching = auth.switchDemoRole("APPLICANT");
  const ending = auth.logout();
  await Promise.all([switching, ending]);
  assert.equal(getAuthSession(), null);
});

test("logout uses the returned switch bearer even if a new sign-in discards its local session", async () => {
  let finishSwitch: (() => void) | undefined;
  const switchedToken = token("ROLE_APPLICANT");
  let revoked = false;
  api.defaults.adapter = async (config) => {
    if (config.url === "/auth/demo/switch") {
      await new Promise<void>((resolve) => {
        finishSwitch = resolve;
      });
      return response(config, { accessToken: switchedToken, expiresIn: 900 });
    }
    if (config.url === "/auth/logout") {
      assert.equal(
        config.headers.get("Authorization"),
        `Bearer ${switchedToken}`,
      );
      revoked = true;
      return response(config, "", 204);
    }
    return response(config, { accessToken: token(), expiresIn: 900 });
  };
  await auth.startDemo();
  const switching = auth.switchDemoRole("APPLICANT").catch(() => undefined);
  while (!finishSwitch) await new Promise((resolve) => setTimeout(resolve, 1));
  const ending = auth.logout();
  const signingIn = auth.login({
    email: "new@example.com",
    password: "password",
  });
  finishSwitch();
  await Promise.all([switching, ending, signingIn]);
  assert.equal(revoked, true);
  assert.ok(getAuthSession());
});

test("switch completion cannot release a later logout's refresh reservation", async () => {
  let finishSwitch: (() => void) | undefined;
  let refreshes = 0;
  api.defaults.adapter = async (config) => {
    if (config.url === "/auth/demo/switch")
      await new Promise<void>((resolve) => {
        finishSwitch = resolve;
      });
    if (config.url === "/auth/refresh") refreshes++;
    return response(
      config,
      config.url === "/auth/logout"
        ? ""
        : {
            accessToken: token(
              config.url === "/auth/demo/switch"
                ? "ROLE_APPLICANT"
                : "ROLE_COMPANY",
            ),
            expiresIn: 900,
          },
      config.url === "/auth/logout" ? 204 : 200,
    );
  };
  await auth.startDemo();
  const switching = auth.switchDemoRole("APPLICANT");
  const unexpectedRefresh = switching
    .then(() => refreshAccessToken())
    .catch(() => undefined);
  while (!finishSwitch) await new Promise((resolve) => setTimeout(resolve, 1));
  const ending = auth.logout();
  finishSwitch();
  await Promise.all([switching, ending, unexpectedRefresh]);
  assert.equal(refreshes, 0);
  assert.equal(getAuthSession(), null);
});
