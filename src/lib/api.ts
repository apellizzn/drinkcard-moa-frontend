import { sessionStore } from "./session";

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const API_BASE_URL =
  configuredApiBaseUrl === undefined
    ? import.meta.env.DEV
      ? ""
      : "http://localhost:8080"
    : configuredApiBaseUrl.replace(/\/$/, "");

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

export async function api<T = unknown>(
  path: string,
  opts: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = opts;
  const h = new Headers(headers);
  h.set("Accept", "application/json");
  if (rest.body && !h.has("Content-Type")) h.set("Content-Type", "application/json");
  if (auth) {
    const s = sessionStore.get();
    if (s?.token) h.set("Authorization", `Bearer ${s.token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...rest, headers: h });
  } catch (e) {
    throw new ApiError(0, "No se puede conectar con el servidor", e);
  }

  const text = await res.text();
  const data = text ? safeJson(text) : undefined;

  if (!res.ok) {
    // Only clear the session if the auth endpoint itself rejects the token.
    // A 401 from any other endpoint can be a transient backend issue and
    // must NOT kick the user out — that caused logouts on page reload.
    if (res.status === 401 && /\/auth\/(me|refresh)\b/.test(path)) {
      sessionStore.clear();
    }
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
