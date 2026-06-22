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

type HttpOptions = RequestInit & {
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};

const REFRESH_PATH = "/api/v1/auth/refresh";
const REFRESH_LOCK_KEY = "drinkcard.refresh.lock";
const REFRESH_LOCK_TTL_MS = 8_000;
const REFRESH_WAIT_TIMEOUT_MS = 9_000;
const tabId = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);

let refreshPromise: Promise<Session | null> | null = null;

export async function http<T = unknown>(path: string, opts: HttpOptions = {}): Promise<T> {
  const { auth = true, retryOnUnauthorized = true, headers, ...rest } = opts;
  const session = auth ? sessionStore.get() : null;

  let result = await request(path, rest, headers, auth ? session?.token : undefined);

  if (result.response.status === 401 && auth && retryOnUnauthorized && session?.refreshToken) {
    const refreshedSession = await refreshSession();
    if (refreshedSession?.token) {
      result = await request(path, rest, headers, refreshedSession.token);
    }
  }

  if (!result.response.ok) {
    throw apiErrorFromResponse(result.response, result.data);
  }

  return result.data as T;
}

async function request(
  path: string,
  rest: RequestInit,
  headers: HeadersInit | undefined,
  accessToken?: string,
) {
  const h = new Headers(headers);
  h.set("Accept", "application/json");
  if (rest.body && !h.has("Content-Type")) h.set("Content-Type", "application/json");
  if (accessToken) h.set("Authorization", `Bearer ${accessToken}`);

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

  const data = result.data as Partial<Session>;
  const refreshedSession = normalizeSession({
    ...session,
    token: data.token,
    refreshToken: data.refreshToken,
    volunteerId: data.volunteerId,
    userId: data.userId ?? data.volunteerId,
    email: data.email,
    role: data.role,
  });

  sessionStore.set(refreshedSession);
  return refreshedSession;
}

function waitForOtherTabRefresh(previousRefreshToken: string): Promise<Session | null> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (session: Session | null) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("storage", onStorage);
      clearTimeout(timeout);
      resolve(session);
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== SESSION_STORAGE_KEY) return;
      const session = sessionStore.get();
      if (!session) {
        finish(null);
        return;
      }
      if (session.refreshToken && session.refreshToken !== previousRefreshToken) {
        finish(session);
      }
    };

    const timeout = window.setTimeout(() => finish(null), REFRESH_WAIT_TIMEOUT_MS);
    window.addEventListener("storage", onStorage);
  });
}

function tryAcquireRefreshLock() {
  try {
    const now = Date.now();
    const current = parseRefreshLock(localStorage.getItem(REFRESH_LOCK_KEY));
    if (current && current.expiresAt > now && current.owner !== tabId) return false;

    localStorage.setItem(
      REFRESH_LOCK_KEY,
      JSON.stringify({ owner: tabId, expiresAt: now + REFRESH_LOCK_TTL_MS }),
    );

    return parseRefreshLock(localStorage.getItem(REFRESH_LOCK_KEY))?.owner === tabId;
  } catch {
    return true;
  }
}

function releaseRefreshLock() {
  try {
    if (parseRefreshLock(localStorage.getItem(REFRESH_LOCK_KEY))?.owner === tabId) {
      localStorage.removeItem(REFRESH_LOCK_KEY);
    }
  } catch {
    // Ignore storage failures: the TTL makes the lock self-healing.
  }
}

function parseRefreshLock(raw: string | null): { owner: string; expiresAt: number } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { owner?: unknown; expiresAt?: unknown };
    if (typeof parsed.owner !== "string" || typeof parsed.expiresAt !== "number") return null;
    return { owner: parsed.owner, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

function apiErrorFromResponse(response: Response, data: unknown) {
  const msg =
    (data &&
      typeof data === "object" &&
      "message" in data &&
      (data as { message?: unknown }).message) ||
    (data && typeof data === "object" && "error" in data && (data as { error?: unknown }).error) ||
    (typeof data === "string" && data.trim()) ||
    response.statusText ||
    "Error en la petición";
  return new ApiError(response.status, String(msg), data);
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
