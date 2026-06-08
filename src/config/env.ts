// `VITE_API_BASE_URL` is a build-time variable. Vite inlines it during `vite build`,
// so it must be set in the shell environment when building/deploying (e.g.
// `VITE_API_BASE_URL=https://api.example.com bun run deploy`). Setting it in
// `wrangler.jsonc` `vars` does NOT work — that block only injects runtime Worker
// bindings, which arrive after the client bundle has already been compiled.
//
// - Empty string in DEV  -> requests go through the Vite `/api` proxy.
// - Empty string in PROD -> requests are issued same-origin (relative URLs).
// - Set value            -> requests are issued against that absolute URL.
const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

export const env = {
  apiBaseUrl: rawApiBaseUrl ? rawApiBaseUrl.replace(/\/$/, "") : "",
};
