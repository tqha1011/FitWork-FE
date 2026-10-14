import { api } from "./api.ts";
import type { DemoSession } from "../types/demo.ts";
export async function getDemoSession(
  signal?: AbortSignal,
): Promise<DemoSession> {
  return (await api.get<DemoSession>("/demo/session", { signal })).data;
}
