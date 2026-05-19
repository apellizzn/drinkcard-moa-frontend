import { sessionStore } from "./session";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8080";

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
    if (res.status === 401) sessionStore.clear();
    const msg =
      (data && typeof data === "object" && "message" in (data as any) && (data as any).message) ||
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
