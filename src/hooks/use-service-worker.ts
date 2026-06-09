import { useEffect } from "react";

// Registers /sw.js once on mount. Client-only — guarded to avoid SSR access to navigator.
// On update we tell the new worker to skip waiting and reload, so users on the festival
// floor pick up fixes within one extra page load instead of needing to clear their cache.
export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (!window.isSecureContext) return; // SW requires HTTPS or localhost

    let cancelled = false;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (cancelled) return;

        // If a worker is already waiting (previous tab installed it), activate it now.
        if (registration.waiting) {
          registration.waiting.postMessage("SKIP_WAITING");
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              installing.postMessage("SKIP_WAITING");
            }
          });
        });

        // Reload exactly once when control changes to the new SW so the user gets fresh assets.
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      } catch (error) {
        console.warn("[sw] registration failed", error);
      }
    };

    void register();
    return () => {
      cancelled = true;
    };
  }, []);
}
