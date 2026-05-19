import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { sessionStore } from "@/lib/session";
import { AppHeader } from "@/components/AppHeader";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;
    if (!sessionStore.get()) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: () => (
    <div className="min-h-screen">
      <AppHeader />
      <Outlet />
    </div>
  ),
});
