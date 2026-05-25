import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
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

  if (isAdmin(session?.role)) return null;

  return <Outlet />;
}
