import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession } from "@/hooks/use-session";
import { isAdmin, sessionStore } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/app")({
  beforeLoad: () => {
    const session = sessionStore.get();
    if (isAdmin(session?.role)) throw redirect({ to: "/admin" });
  },
  component: AppLayout,
});

function AppLayout() {
  const session = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin(session?.role)) {
      navigate({ to: "/admin", replace: true });
    }
  }, [navigate, session?.role]);

  if (isAdmin(session?.role)) return null;

  return <Outlet />;
}
