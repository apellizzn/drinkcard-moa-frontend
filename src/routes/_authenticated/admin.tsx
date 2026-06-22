import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { isAdmin, sessionStore } from "@/lib/session";
import { useSession } from "@/hooks/use-session";
import { LayoutDashboard, Users, Calendar, LineChart, Ticket, CreditCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const s = sessionStore.get();
    if (!s) throw redirect({ to: "/login" });
    if (s.role !== "ADMIN") throw redirect({ to: "/app" });
  },
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Panel admin — DrinkCard MOA" }] }),
});

const NAV: Array<{ to: "/admin" | "/admin/volunteers" | "/admin/tickets" | "/admin/payments" | "/admin/shifts" | "/admin/analytics"; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/volunteers", label: "Voluntarios", icon: Users },
  { to: "/admin/tickets", label: "Tickets", icon: Ticket },
  { to: "/admin/payments", label: "Pagos", icon: CreditCard },
  { to: "/admin/shifts", label: "Turnos", icon: Calendar },
  { to: "/admin/analytics", label: "Analíticas", icon: LineChart },
];

function AdminLayout() {
  const { pathname } = useLocation();
  const session = useSession();

  if (!isAdmin(session?.role)) return null;

  return (
    <div className="admin-clean min-h-[calc(100vh-66px)] bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
        <aside className="md:sticky md:top-20 md:self-start">
          <div className="admin-panel p-2">
            <nav className="flex md:flex-col gap-1 overflow-x-auto">
              {NAV.map((n) => {
                const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
                return (
                  <Link key={n.to} to={n.to} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>
                    <n.icon className="h-4 w-4" /> {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        <section><Outlet /></section>
      </div>
    </div>
  );
}
