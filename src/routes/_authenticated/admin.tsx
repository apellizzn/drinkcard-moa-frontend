import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { sessionStore } from "@/lib/session";
import { LayoutDashboard, Users, Calendar, LineChart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: () => {
    const s = sessionStore.get();
    if (!s) throw redirect({ to: "/login" });
    if (s.role !== "ADMIN") throw redirect({ to: "/app" });
  },
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Panel admin — DrinkCard MOA" }] }),
});

const NAV: Array<{ to: "/admin" | "/admin/volunteers" | "/admin/shifts" | "/admin/analytics"; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/volunteers", label: "Voluntarios", icon: Users },
  { to: "/admin/shifts", label: "Turnos", icon: Calendar },
  { to: "/admin/analytics", label: "Analíticas", icon: LineChart },
];

function AdminLayout() {
  const { pathname } = useLocation();
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 grid gap-6 md:grid-cols-[220px_1fr]">
      <aside className="md:sticky md:top-20 md:self-start">
        <div className="rounded-3xl border-2 bg-sidebar p-3 sticker">
          <nav className="flex md:flex-col gap-1 overflow-x-auto">
            {NAV.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              return (
                <Link key={n.to} to={n.to} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${active ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent"}`}>
                  <n.icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <section><Outlet /></section>
    </div>
  );
}
