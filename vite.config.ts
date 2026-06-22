// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

const localEnv = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");

const allowedHosts = (
  process.env.VITE_ALLOWED_HOSTS ??
  localEnv.VITE_ALLOWED_HOSTS ??
  "uncharted-apply-upstart.ngrok-free.dev,ed65-2a02-a457-f45c-0-ada7-3b73-7aa7-aeb7.ngrok-free.app"
)
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const apiProxyTarget =
  process.env.VITE_API_PROXY_TARGET ?? localEnv.VITE_API_PROXY_TARGET ?? "http://localhost:8080";
const apiProxyHost = process.env.VITE_API_PROXY_HOST ?? localEnv.VITE_API_PROXY_HOST;

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  vite: {
    server: {
      allowedHosts,
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.removeHeader("origin");
              if (apiProxyHost) {
                proxyReq.setHeader("host", apiProxyHost);
              }
            });
          },
        },
      },
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: true,
});
