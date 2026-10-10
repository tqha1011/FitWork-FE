import { io } from "socket.io-client";
import { api, refreshAccessToken } from "./api.ts";
import { getAuthSession, subscribeAuthSession } from "./authSession.ts";
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
  options: { auth: { token: string }; autoConnect: false },
) => ProcessingSocket;

export function watchProcessing(
  kind: "resume" | "evaluation",
  target: Pick<ResumeReference, "publicId" | "ingestionPublicId"> | string,
  onState: (state: State) => void,
  onConnection: (state: ConnectionState) => void,
  factory: SocketFactory = io as SocketFactory,
): () => void {
  const origin = new URL(
    api.defaults.baseURL ?? "http://localhost:3000/api",
    window.location.origin,
  ).origin;
  const join = `${kind}-join`;
  const notify =
    kind === "resume" ? "ingestion-process-notify" : "evaluation-score-notify";
  const payload: Record<string, string> =
    typeof target === "string"
      ? { evaluationPublicId: target }
      : { resumePublicId: target.publicId };
  let stopped = false;
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
      if (!stopped) onConnection("uncertain");
    }, 20000);
  };
  const accept = (next: State) => {
    if (stopped || !acceptProcessingState(target, latest, next)) return;
    latest = next;
    clearTimer();
    onConnection("connected");
    onState(next);
    if (next.status === "PENDING" || next.status === "PROCESSING") arm();
  };
  const connect = () => {
    const session = getAuthSession();
    if (!session || stopped) return;
    if (session.accessToken === token) return;
    token = session.accessToken;
    socket?.removeAllListeners();
    socket?.disconnect();
    socket = factory(`${origin}/${kind}`, {
      auth: { token },
      autoConnect: false,
    });
    socket.on(join, ((data: { joined: boolean; current?: State }) => {
      if (stopped) return;
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
      if (!stopped) {
        onConnection("connecting");
        socket?.emit(join, payload);
        arm();
      }
    });
    socket.on("disconnect", () => {
      if (!stopped) {
        clearTimer();
        onConnection("uncertain");
      }
    });
    socket.on("connect_error", () => {
      if (!stopped) {
        clearTimer();
        onConnection("uncertain");
      }
    });
    onConnection("connecting");
    arm();
    socket.connect();
  };
  const unsubscribe = subscribeAuthSession(() => {
    if (!getAuthSession()) {
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
        if (!stopped) onConnection("uncertain");
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
