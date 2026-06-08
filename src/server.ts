import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

interface WorkerEnv {
  API_UPSTREAM_URL?: string;
}

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

// Hop-by-hop headers (RFC 7230 §6.1) — must not be forwarded by a proxy.
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
]);

function stripHopByHopHeaders(headers: Headers): Headers {
  const out = new Headers();
  headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      out.set(key, value);
    }
  });
  return out;
}

// Server-side proxy for /api/* requests. The browser always calls /api/* on the
// Worker origin (no CORS, first-party cookies); the Worker then forwards to the
// real backend identified by `API_UPSTREAM_URL` from wrangler.jsonc `vars`.
async function proxyApiRequest(request: Request, env: WorkerEnv): Promise<Response> {
  const upstream = env.API_UPSTREAM_URL?.trim().replace(/\/$/, "");
  if (!upstream) {
    return new Response(
      JSON.stringify({ message: "API_UPSTREAM_URL is not configured" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  const incomingUrl = new URL(request.url);
  const targetUrl = `${upstream}${incomingUrl.pathname}${incomingUrl.search}`;

  const init: RequestInit = {
    method: request.method,
    headers: stripHopByHopHeaders(request.headers),
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    // Required by the Workers fetch implementation when streaming a body.
    (init as RequestInit & { duplex?: "half" }).duplex = "half";
  }

  try {
    const upstreamResponse = await fetch(targetUrl, init);
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: stripHopByHopHeaders(upstreamResponse.headers),
    });
  } catch (error) {
    console.error("API proxy error:", error);
    return new Response(
      JSON.stringify({ message: "Upstream API unreachable" }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) {
        return await proxyApiRequest(request, env);
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
