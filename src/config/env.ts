export const env = {
  apiBaseUrl:
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
    (import.meta.env.DEV ? "" : "http://localhost:8080"),
};
