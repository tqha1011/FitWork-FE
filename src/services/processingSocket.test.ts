import assert from "node:assert/strict";
import { test } from "node:test";
import {
  watchProcessing,
  type ProcessingSocket,
  type ConnectionState,
} from "./processingSocket.ts";
import {
  clearAccessToken,
  getSessionGeneration,
  setAuthSession,
} from "./authSession.ts";
import type { EvaluationState, ResumeReference } from "../types/evaluation.ts";
class FakeSocket implements ProcessingSocket {
  auth: Record<string, unknown> = {};
  listeners = new Map<string, (...args: never[]) => void>();
  sent: [string, Record<string, string>][] = [];
  disconnected = false;
  on(event: string, listener: (...args: never[]) => void) {
    this.listeners.set(event, listener);
  }
  emit(event: string, payload: Record<string, string>) {
    this.sent.push([event, payload]);
  }
  connect() {
    this.server("connect");
  }
  disconnect() {
    this.disconnected = true;
    this.server("disconnect");
  }
  removeAllListeners() {
    this.listeners.clear();
  }
  server(event: string, data?: unknown) {
    this.listeners.get(event)?.(data as never);
  }
}
function authenticate(seed: string) {
  const claims = Buffer.from(
    JSON.stringify({
      sub: "user",
      email: "user@example.com",
      role: "ROLE_APPLICANT",
      exp: Math.floor(Date.now() / 1000) + 3600,
      seed,
    }),
  ).toString("base64url");
  return setAuthSession(
    { accessToken: `header.${claims}.signature`, expiresIn: 3600 },
    getSessionGeneration(),
  );
}
Object.defineProperty(globalThis, "window", {
  value: { location: { origin: "http://localhost:5173" } },
  configurable: true,
});
test("evaluation snapshot, reconnect, refreshed token, denial and cleanup follow Socket.IO event contract", () => {
  authenticate("first");
  const sockets: FakeSocket[] = [];
  const accepted: EvaluationState[] = [];
  const connections: ConnectionState[] = [];
  const cleanup = watchProcessing(
    "evaluation",
    "evaluation",
    (state) => accepted.push(state as EvaluationState),
    (state) => connections.push(state),
    (url, options) => {
      assert.equal(url, "http://localhost:3000/evaluation");
      assert.equal(options.autoConnect, false);
      assert.equal(options.auth.token.startsWith("Bearer"), false);
      const socket = new FakeSocket();
      socket.auth = options.auth;
      sockets.push(socket);
      return socket;
    },
  );
  try {
    const socket = sockets[0];
    assert.deepEqual(socket.sent, [
      ["evaluation-join", { evaluationPublicId: "evaluation" }],
    ]);
    const current: EvaluationState = {
      evaluationPublicId: "evaluation",
      status: "COMPLETED",
      overallScore: 0,
      updatedAt: "2026-10-10T08:00:00Z",
    };
    socket.server("evaluation-join", { joined: true, current });
    socket.server("evaluation-score-notify", {
      ...current,
      evaluationPublicId: "foreign",
    });
    socket.server("evaluation-score-notify", {
      ...current,
      status: "PROCESSING",
      updatedAt: "2026-10-10T07:00:00Z",
    });
    assert.deepEqual(accepted, [current]);
    socket.server("disconnect");
    assert.equal(connections.at(-1), "uncertain");
    socket.server("connect");
    assert.equal(socket.sent.length, 2);
    authenticate("refreshed");
    assert.equal(sockets.length, 2);
    assert.equal(socket.disconnected, true);
    assert.equal(socket.listeners.size, 0);
    sockets[1].server("evaluation-join", { joined: false });
    assert.equal(connections.at(-1), "denied");
  } finally {
    cleanup();
    clearAccessToken();
  }
  assert.equal(sockets[1].listeners.size, 0);
  assert.equal(sockets[1].disconnected, true);
  assert.equal(
    sockets[1].sent.some(([event]) => event === "evaluation-leave"),
    false,
  );
});
test("resume watcher filters old ingestion, accepts join snapshot and leaves on cleanup", () => {
  authenticate("resume");
  const socket = new FakeSocket();
  const accepted: unknown[] = [];
  const ref: ResumeReference = {
    publicId: "resume",
    ingestionPublicId: "new",
    ingestionStatus: "PENDING",
  };
  const cleanup = watchProcessing(
    "resume",
    ref,
    (state) => accepted.push(state),
    () => {},
    () => socket,
  );
  try {
    const current = {
      resumePublicId: "resume",
      ingestionPublicId: "new",
      status: "COMPLETED",
      updatedAt: "2026-10-10T08:00:00Z",
    };
    socket.server("ingestion-process-notify", {
      ...current,
      ingestionPublicId: "old",
    });
    socket.server("resume-join", { joined: true, current });
    assert.deepEqual(accepted, [current]);
  } finally {
    cleanup();
    clearAccessToken();
  }
  assert.deepEqual(socket.sent.at(-1), [
    "resume-leave",
    { resumePublicId: "resume" },
  ]);
});

test("overdue updates report uncertainty without inventing worker failure", (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  authenticate("timeout");
  const socket = new FakeSocket();
  const accepted: EvaluationState[] = [];
  const connections: ConnectionState[] = [];
  const cleanup = watchProcessing(
    "evaluation",
    "evaluation",
    (state) => accepted.push(state as EvaluationState),
    (state) => connections.push(state),
    () => socket,
  );
  try {
    socket.server("evaluation-join", {
      joined: true,
      current: {
        evaluationPublicId: "evaluation",
        status: "PROCESSING",
        updatedAt: "2026-10-10T08:00:00Z",
      },
    });
    context.mock.timers.tick(20000);
    assert.equal(connections.at(-1), "uncertain");
    assert.equal(accepted.length, 1);
    assert.equal(accepted[0].status, "PROCESSING");
    socket.server("evaluation-score-notify", {
      evaluationPublicId: "evaluation",
      status: "COMPLETED",
      overallScore: 0,
      updatedAt: "2026-10-10T08:00:01Z",
    });
    assert.equal(connections.at(-1), "connected");
    assert.equal(accepted.at(-1)?.overallScore, 0);
  } finally {
    cleanup();
    clearAccessToken();
  }
});

test("role transition disconnects old sockets and ignores queued old-generation notifications", async () => {
  const { beginSessionTransition } = await import("./authSession.ts");
  authenticate("before-switch");
  const sockets: FakeSocket[] = [];
  const accepted: unknown[] = [];
  const stop = watchProcessing(
    "evaluation",
    "evaluation",
    (state) => accepted.push(state),
    () => {},
    () => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket;
    },
  );
  const queued = sockets[0].listeners.get("evaluation-score-notify");
  try {
    beginSessionTransition();
    assert.equal(sockets[0].disconnected, true);
    queued?.({
      evaluationPublicId: "evaluation",
      status: "COMPLETED",
      overallScore: 99,
      updatedAt: new Date().toISOString(),
    } as never);
    assert.deepEqual(accepted, []);
    authenticate("after-switch");
    assert.equal(
      sockets.length,
      1,
      "Old rooms must not rejoin under a different role",
    );
  } finally {
    stop();
    clearAccessToken();
  }
});
