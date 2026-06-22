import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { isAdmin, sessionStore } from "@/lib/session";
import { useSession } from "@/hooks/use-session";
import { LayoutDashboard, Users, Calendar, LineChart, Ticket, CreditCard } from "lucide-react";
import { useI18n } from "@/i18n/i18n";
import type { TranslationKey } from "@/i18n/translations";

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

const NAV: Array<{
  to:
    | "/admin"
    | "/admin/volunteers"
    | "/admin/tickets"
    | "/admin/payments"
    | "/admin/shifts"
    | "/admin/analytics";
  labelKey: TranslationKey;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}> = [
  { to: "/admin", labelKey: "admin.nav.dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/volunteers", labelKey: "admin.nav.volunteers", icon: Users },
  { to: "/admin/tickets", labelKey: "admin.nav.tickets", icon: Ticket },
  { to: "/admin/payments", labelKey: "admin.nav.payments", icon: CreditCard },
  { to: "/admin/shifts", labelKey: "admin.nav.shifts", icon: Calendar },
  { to: "/admin/analytics", labelKey: "admin.nav.analytics", icon: LineChart },
];

function AdminLayout() {
  const { pathname } = useLocation();
  const session = useSession();
  const { t } = useI18n();

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
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}
                  >
                    <n.icon className="h-4 w-4" /> {t(n.labelKey)}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        <section>
          <Outlet />
        </section>
      </div>
    </div>
  );
}
