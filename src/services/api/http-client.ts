import { env } from "@/config/env";
import { sessionStore } from "@/lib/session";

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

export async function http<T = unknown>(
  path: string,
  opts: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = opts;
  const h = new Headers(headers);
  h.set("Accept", "application/json");
  if (rest.body && !h.has("Content-Type")) h.set("Content-Type", "application/json");
  if (auth) {
    const session = sessionStore.get();
    if (session?.token) h.set("Authorization", `Bearer ${session.token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${env.apiBaseUrl}${path}`, { ...rest, headers: h });
  } catch (e) {
    throw new ApiError(0, "No se puede conectar con el servidor", e);
  }

  const text = await res.text();
  const data = text ? safeJson(text) : undefined;

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "message" in (data as any) && (data as any).message) ||
      (data && typeof data === "object" && "error" in (data as any) && (data as any).error) ||
      (typeof data === "string" && data.trim()) ||
      res.statusText ||
      "Error en la petición";
    throw new ApiError(res.status, String(msg), data);
  }

  return data as T;
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
