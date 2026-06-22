import { env } from "@/config/env";
import { sessionStore } from "@/lib/session";
import { translateNow } from "@/lib/i18n";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
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
    throw new ApiError(0, translateNow("errors.network"), e);
  }

  const text = await res.text();
  const data = text ? safeJson(text) : undefined;

  if (!res.ok) {
    const record = data && typeof data === "object" ? (data as Record<string, unknown>) : undefined;
    const msg =
      (record && "message" in record && record.message) ||
      (record && "error" in record && record.error) ||
      (typeof data === "string" && data.trim()) ||
      res.statusText ||
      translateNow("errors.request");
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
