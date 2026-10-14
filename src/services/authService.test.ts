import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { AxiosError, AxiosHeaders } from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { api, refreshAccessToken } from "./api.ts";
import { login, logout, register } from "./authService.ts";
import { clearAccessToken, getAuthSession } from "./authSession.ts";

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
  clearAccessToken();
});

function token(role = "ROLE_APPLICANT", email = "a@example.com") {
  return `header.${Buffer.from(JSON.stringify({ sub: "account-123", email, role, exp: Math.floor(Date.now() / 1000) + 900 })).toString("base64url")}.signature`;
}
function response(
  config: InternalAxiosRequestConfig,
  data: unknown,
  status = 200,
): AxiosResponse {
  return { config, data, status, statusText: "", headers: new AxiosHeaders() };
}
function unauthorized(config: InternalAxiosRequestConfig): never {
  throw new AxiosError(
    "Unauthorized",
    "ERR_BAD_REQUEST",
    config,
    undefined,
    response(
      config,
      {
        statusCode: 401,
        message: "Invalid refresh token",
        timestamp: "2026-10-08T08:00:00.000Z",
        path: config.url,
      },
      401,
    ),
  );
}

test("registration sends the DTO with credentials and leaves the user signed out", async () => {
  const input = {
    email: "a@example.com",
    username: "anna",
    fullName: "A",
    password: "Fitwork@123",
    userType: "COMPANY" as const,
  };
  api.defaults.adapter = async (config) => {
    assert.equal(config.url, "/auth/register");
    assert.equal(config.method, "post");
    assert.equal(config.withCredentials, true);
    assert.equal(config.headers.get("Authorization"), undefined);
    assert.deepEqual(JSON.parse(config.data), input);
    return response(config, { publicId: "account-123" }, 201);
  };
  assert.deepEqual(await register(input), { publicId: "account-123" });
  assert.equal(getAuthSession(), null);
});

test("login derives the workspace from the JWT and auth requests never include a bearer token", async () => {
  api.defaults.adapter = async (config) => {
    assert.equal(config.headers.get("Authorization"), undefined);
    return response(config, {
      accessToken: token("ROLE_COMPANY"),
      expiresIn: 900,
    });
  };
  await login({ email: "a@example.com", password: "old" });
  assert.equal(getAuthSession()?.user.role, "client");
  assert.equal(getAuthSession()?.user.publicId, "account-123");
  assert.ok((getAuthSession()?.expiresAt ?? 0) > Date.now());
  await refreshAccessToken();
});

test("concurrent 401s share one rotating refresh and retry with the new token", async () => {
  let refreshes = 0;
  const oldToken = token();
  const newToken = token("ROLE_COMPANY");
  api.defaults.adapter = async (config) => {
    if (config.url === "/auth/login")
      return response(config, { accessToken: oldToken, expiresIn: 900 });
    if (config.url === "/auth/refresh") {
      refreshes++;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return response(config, { accessToken: newToken, expiresIn: 900 });
    }
    if (config.headers.get("Authorization") === `Bearer ${oldToken}`)
      unauthorized(config);
    assert.equal(config.headers.get("Authorization"), `Bearer ${newToken}`);
    return response(config, { ok: true });
  };
  await login({ email: "a@example.com", password: "old" });
  const responses = await Promise.all([
    api.get("/protected/a"),
    api.get("/protected/b"),
    api.get("/protected/c"),
  ]);
  assert.equal(refreshes, 1);
  assert.ok(responses.every((result) => result.data.ok));
});

test("failed refresh clears the session and does not recurse on auth 401", async () => {
  api.defaults.adapter = async (config) => {
    if (config.url === "/auth/login")
      return response(config, { accessToken: token(), expiresIn: 900 });
    unauthorized(config);
  };
  await login({ email: "a@example.com", password: "old" });
  await assert.rejects(api.get("/protected"));
  assert.equal(getAuthSession(), null);
});

test("a retried protected 401 terminates after one refresh", async () => {
  let refreshes = 0;
  api.defaults.adapter = async (config) => {
    if (config.url === "/auth/login")
      return response(config, { accessToken: token(), expiresIn: 900 });
    if (config.url === "/auth/refresh") {
      refreshes++;
      return response(config, {
        accessToken: token("ROLE_COMPANY"),
        expiresIn: 900,
      });
    }
    unauthorized(config);
  };
  await login({ email: "a@example.com", password: "old" });
  await assert.rejects(api.get("/protected"));
  assert.equal(refreshes, 1);
  assert.equal(getAuthSession(), null);
});

test("logout handles an empty 204 and an in-flight refresh cannot restore the session", async () => {
  let finishRefresh: (() => void) | undefined;
  api.defaults.adapter = async (config) => {
    if (config.url === "/auth/login")
      return response(config, { accessToken: token(), expiresIn: 900 });
    if (config.url === "/auth/refresh") {
      await new Promise<void>((resolve) => {
        finishRefresh = resolve;
      });
      return response(config, { accessToken: token(), expiresIn: 900 });
    }
    assert.equal(config.url, "/auth/logout");
    assert.equal(config.headers.get("Authorization"), `Bearer ${token()}`);
    assert.ok(getAuthSession());
    return response(config, "", 204);
  };
  await login({ email: "a@example.com", password: "old" });
  const refreshing = refreshAccessToken().catch(() => null);
  while (!finishRefresh) await new Promise((resolve) => setTimeout(resolve, 1));
  const loggingOut = logout();
  finishRefresh();
  await Promise.all([refreshing, loggingOut]);
  assert.equal(getAuthSession(), null);
});

test("logout clears local state even when the server fails", async () => {
  api.defaults.adapter = async (config) => {
    if (config.url === "/auth/login")
      return response(config, { accessToken: token(), expiresIn: 900 });
    throw new Error("Server unavailable");
  };
  await login({ email: "a@example.com", password: "old" });
  await assert.rejects(logout());
  assert.equal(getAuthSession(), null);
});

test("malformed and unsupported JWT roles never create an authenticated session", async () => {
  for (const accessToken of ["broken", token("ROLE_ADMIN")]) {
    api.defaults.adapter = async (config) =>
      response(config, { accessToken, expiresIn: 900 });
    await assert.rejects(login({ email: "a@example.com", password: "old" }));
    assert.equal(getAuthSession(), null);
  }
});

test("an expired access token is refreshed once before concurrent API calls", async (t) => {
  const now = Date.now();
  let currentTime = now;
  t.mock.method(Date, "now", () => currentTime);
  let refreshes = 0;
  api.defaults.adapter = async (config) => {
    if (config.url === "/auth/login")
      return response(config, { accessToken: token(), expiresIn: 1 });
    if (config.url === "/auth/refresh") {
      refreshes++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return response(config, {
        accessToken: token("ROLE_COMPANY"),
        expiresIn: 900,
      });
    }
    assert.equal(
      config.headers.get("Authorization"),
      `Bearer ${token("ROLE_COMPANY")}`,
    );
    return response(config, { ok: true });
  };
  await login({ email: "a@example.com", password: "old" });
  currentTime += 2000;
  await Promise.all([api.get("/protected/a"), api.get("/protected/b")]);
  assert.equal(refreshes, 1);
});

test("a late 401 reuses the current token instead of rotating refresh a second time", async () => {
  let refreshes = 0;
  const oldToken = token();
  const newToken = token("ROLE_COMPANY");
  api.defaults.adapter = async (config) => {
    if (config.url === "/auth/login")
      return response(config, { accessToken: oldToken, expiresIn: 900 });
    if (config.url === "/auth/refresh") {
      refreshes++;
      return response(config, { accessToken: newToken, expiresIn: 900 });
    }
    if (config.headers.get("Authorization") === `Bearer ${oldToken}`) {
      if (config.url === "/protected/late")
        await new Promise((resolve) => setTimeout(resolve, 20));
      unauthorized(config);
    }
    return response(config, { ok: true });
  };
  await login({ email: "a@example.com", password: "old" });
  await Promise.all([api.get("/protected/fast"), api.get("/protected/late")]);
  assert.equal(refreshes, 1);
});

test("signing in during logout waits for cookie deletion before creating the next session", async () => {
  let finishLogout: (() => void) | undefined;
  let logoutFinished = false;
  let loginCount = 0;
  api.defaults.adapter = async (config) => {
    if (config.url === "/auth/logout") {
      await new Promise<void>((resolve) => {
        finishLogout = resolve;
      });
      logoutFinished = true;
      return response(config, "", 204);
    }
    loginCount++;
    if (loginCount > 1) assert.equal(logoutFinished, true);
    return response(config, { accessToken: token(), expiresIn: 900 });
  };
  await login({ email: "a@example.com", password: "old" });
  const loggingOut = logout();
  while (!finishLogout) await new Promise((resolve) => setTimeout(resolve, 1));
  const loggingIn = login({ email: "a@example.com", password: "old" });
  const outcome = loggingIn.then(
    () => null,
    (error) => error,
  );
  await new Promise((resolve) => setTimeout(resolve, 5));
  finishLogout();
  await loggingOut;
  assert.equal(await outcome, null);
  assert.equal(getAuthSession()?.user.publicId, "account-123");
});

test("overlapping logins cannot deliver cookies out of order", async () => {
  let finishFirst: (() => void) | undefined;
  let secondStarted = false;
  let cookieEmail = "";
  api.defaults.adapter = async (config) => {
    const { email } = JSON.parse(config.data);
    if (email === "first@example.com")
      await new Promise<void>((resolve) => {
        finishFirst = resolve;
      });
    else secondStarted = true;
    cookieEmail = email;
    return response(config, {
      accessToken: token("ROLE_APPLICANT", email),
      expiresIn: 900,
    });
  };
  const first = login({ email: "first@example.com", password: "old" }).catch(
    (error) => error,
  );
  while (!finishFirst) await new Promise((resolve) => setTimeout(resolve, 1));
  const second = login({ email: "second@example.com", password: "old" });
  await new Promise((resolve) => setTimeout(resolve, 5));
  const startedEarly = secondStarted;
  finishFirst();
  await Promise.all([first, second]);
  assert.equal(startedEarly, false);
  assert.equal(getAuthSession()?.user.email, "second@example.com");
  assert.equal(cookieEmail, "second@example.com");
});

test("logout waits for an outstanding login so its cookie cannot restore a signed-out session", async () => {
  let finishLogin: (() => void) | undefined;
  let cookiePresent = false;
  api.defaults.adapter = async (config) => {
    if (config.url === "/auth/login") {
      await new Promise<void>((resolve) => {
        finishLogin = resolve;
      });
      cookiePresent = true;
      return response(config, { accessToken: token(), expiresIn: 900 });
    }
    cookiePresent = false;
    return response(config, "", 204);
  };
  const loggingIn = login({ email: "a@example.com", password: "old" }).catch(
    (error) => error,
  );
  while (!finishLogin) await new Promise((resolve) => setTimeout(resolve, 1));
  const loggingOut = logout();
  await new Promise((resolve) => setTimeout(resolve, 5));
  finishLogin();
  await Promise.all([loggingIn, loggingOut]);
  assert.equal(getAuthSession(), null);
  assert.equal(cookiePresent, false);
});
