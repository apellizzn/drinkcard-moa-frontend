// The browser bundle always issues same-origin requests under `/api/*`.
//
// - In development, Vite's dev server proxies `/api/*` to the backend
//   (see `VITE_API_PROXY_TARGET` in vite.config.ts).
// - In production, the Cloudflare Worker proxies `/api/*` to the real backend
//   (see `API_UPSTREAM_URL` in wrangler.jsonc and src/server.ts).
//
// Same-origin avoids CORS, keeps cookies first-party, and lets us swap the
// upstream per environment without rebuilding the client bundle.
export const env = {
  apiBaseUrl: "",
};
