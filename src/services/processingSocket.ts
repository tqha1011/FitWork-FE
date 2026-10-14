import { io } from "socket.io-client";
import { api, API_BASE_URL, refreshAccessToken } from "./api.ts";
import {
  getAuthSession,
  getSessionGeneration,
  subscribeAuthSession,
} from "./authSession.ts";
import { acceptProcessingState } from "../shared/processingState.ts";
import type {
  EvaluationState,
  ResumeIngestionState,
  ResumeReference,
} from "../types/evaluation.ts";

export type ConnectionState =
  "connecting" | "connected" | "uncertain" | "denied";
type State = ResumeIngestionState | EvaluationState;
export interface ProcessingSocket {
  auth: Record<string, unknown>;
  on(event: string, listener: (...args: never[]) => void): unknown;
  emit(event: string, payload: Record<string, string>): unknown;
  connect(): unknown;
  disconnect(): unknown;
  removeAllListeners(): unknown;
}
type SocketFactory = (
  url: string,
  options: { auth: { token: string }; autoConnect: false; path: string },
) => ProcessingSocket;

export function watchProcessing(
  kind: "resume" | "evaluation",
  target: Pick<ResumeReference, "publicId" | "ingestionPublicId"> | string,
  onState: (state: State) => void,
  onConnection: (state: ConnectionState) => void,
  factory: SocketFactory = io as SocketFactory,
): () => void {
  const origin = new URL(
    api.defaults.baseURL ?? API_BASE_URL,
    window.location.origin,
  ).origin;
  const join = `${kind}-join`;
  const notify =
    kind === "resume" ? "ingestion-process-notify" : "evaluation-score-notify";
  const payload: Record<string, string> =
    typeof target === "string"
      ? { evaluationPublicId: target }
      : { resumePublicId: target.publicId };
  const generation = getSessionGeneration();
  let stopped = false;
  const active = () =>
    !stopped &&
    generation === getSessionGeneration() &&
    !getAuthSession()?.transitioning;
  let latest: State | undefined;
  let socket: ProcessingSocket | undefined;
  let token: string | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const clearTimer = () => {
    if (timer) clearTimeout(timer);
  };
  const arm = () => {
    clearTimer();
    timer = setTimeout(() => {
      if (active()) onConnection("uncertain");
    }, 20000);
  };
  const accept = (next: State) => {
    if (!active() || !acceptProcessingState(target, latest, next)) return;
    latest = next;
    clearTimer();
    onConnection("connected");
    onState(next);
    if (next.status === "PENDING" || next.status === "PROCESSING") arm();
  };
  const connect = () => {
    const session = getAuthSession();
    if (!session || !active()) return;
    if (session.accessToken === token) return;
    token = session.accessToken;
    socket?.removeAllListeners();
    socket?.disconnect();
    socket = factory(`${origin}/${kind}`, {
      auth: { token },
      autoConnect: false,
      path: "/socket.io",
    });
    socket.on(join, ((data: { joined: boolean; current?: State }) => {
      if (!active()) return;
      if (!data.joined) {
        clearTimer();
        onConnection("denied");
      } else if (data.current) accept(data.current);
      else {
        onConnection("uncertain");
        arm();
      }
    }) as (...args: never[]) => void);
    socket.on(notify, accept as (...args: never[]) => void);
    socket.on("connect", () => {
      if (active()) {
        onConnection("connecting");
        socket?.emit(join, payload);
        arm();
      }
    });
    socket.on("disconnect", () => {
      if (active()) {
        clearTimer();
        onConnection("uncertain");
      }
    });
    socket.on("connect_error", () => {
      if (active()) {
        clearTimer();
        onConnection("uncertain");
      }
    });
    onConnection("connecting");
    arm();
    socket.connect();
  };
  const unsubscribe = subscribeAuthSession(() => {
    if (!getAuthSession() || !active()) {
      token = undefined;
      socket?.removeAllListeners();
      socket?.disconnect();
      clearTimer();
      onConnection("uncertain");
    } else connect();
  });
  const session = getAuthSession();
  if (session && session.expiresAt <= Date.now()) {
    void refreshAccessToken()
      .then(connect)
      .catch(() => {
        if (active()) onConnection("uncertain");
      });
  } else connect();
  return () => {
    stopped = true;
    clearTimer();
    unsubscribe();
    if (kind === "resume") socket?.emit("resume-leave", payload);
    socket?.removeAllListeners();
    socket?.disconnect();
  };
}
