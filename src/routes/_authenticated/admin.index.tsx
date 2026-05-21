import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Users, Wallet, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { AdminDataTable, AdminEmptyRow, AdminStatusBadge, AdminTable } from "@/components/admin/AdminDataTable";
import {
  listDrinkCardAccounts,
  listRecentPayments,
  listVolunteerUsers,
  type AdminPaymentSummary,
  type PageResponse,
  type UserSummary,
} from "@/services/api/admin-service";
import type { DrinkCardAccount } from "@/services/api/drink-card-service";

type AccountResponse = DrinkCardAccount[] | PageResponse<DrinkCardAccount>;

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const users = useQuery({ queryKey: ["admin", "users"], queryFn: () => listVolunteerUsers(200) });
  const accounts = useQuery({ queryKey: ["admin", "accounts"], queryFn: listDrinkCardAccounts });
  const payments = useQuery({ queryKey: ["admin", "payments"], queryFn: () => listRecentPayments(10) });

  const userList = arr<UserSummary>(users.data);
  const accList = arr<DrinkCardAccount>(accounts.data as AccountResponse | undefined);
  const payList = arr<AdminPaymentSummary>(payments.data);
  const activeCards = accList.filter((a) => a.status === "ACTIVE").length;
  const totalCredits = accList.reduce((s, a) => s + (a.credits || 0), 0);
  const successPays = payList.filter((p) => p.status === "SUCCESS");
  const revenue = successPays.reduce((s, p) => s + (p.amount ?? 0), 0);

  const mix = [
    { label: "Cerveza", value: 42, color: "bg-neon-yellow" },
    { label: "Vino", value: 26, color: "bg-neon-pink" },
    { label: "Refresco", value: 20, color: "bg-neon-orange" },
    { label: "Agua", value: 12, color: "bg-neon-cyan" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Dashboard</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-950">Vista general</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={CreditCard} label="Tarjetas activas" value={activeCards} accent="red" />
        <Kpi icon={Wallet} label="Créditos en circulación" value={totalCredits} accent="amber" />
        <Kpi icon={Users} label="Voluntarios" value={userList.length} accent="blue" />
        <Kpi icon={TrendingUp} label="Ingresos (€)" value={revenue.toFixed(2)} accent="green" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <AdminDataTable title="Pagos recientes" description="Últimas operaciones registradas por el backend" className="lg:col-span-2">
          <AdminTable>
            <thead>
              <tr><th>Fecha</th><th>Voluntario</th><th className="text-right">Importe</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {payList.length === 0 && <AdminEmptyRow colSpan={4}>Sin pagos aún.</AdminEmptyRow>}
              {payList.map((p) => (
                <tr key={p.paymentId}>
                  <td>{p.createdAt ? format(new Date(p.createdAt), "d MMM HH:mm") : "—"}</td>
                  <td className="font-mono text-xs">{p.volunteerId?.slice(0, 8)}…</td>
                  <td className="text-right font-medium text-slate-950">{(p.amount ?? 10).toFixed(2)} €</td>
                  <td><AdminStatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </AdminDataTable>
        <div className="admin-panel p-5">
          <h2 className="text-base font-semibold text-slate-950">Mezcla de bebidas</h2>
          <p className="mt-1 text-sm text-slate-500">Demo · pendiente endpoint</p>
          <div className="space-y-3">
            {mix.map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-sm"><span>{m.label}</span><span className="font-mono">{m.value}%</span></div>
                <div className="mt-1 h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${m.color}`} style={{ width: `${m.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent: "red" | "amber" | "blue" | "green" }) {
  const colors = {
    red: "text-red-600 bg-red-50",
    amber: "text-amber-600 bg-amber-50",
    blue: "text-blue-600 bg-blue-50",
    green: "text-emerald-600 bg-emerald-50",
  };

  return (
    <div className="admin-panel p-5">
      <div className={`grid h-10 w-10 place-items-center rounded-lg ${colors[accent]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-3xl font-semibold text-slate-950">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}

function arr<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  if (x && typeof x === "object" && "content" in (x as any) && Array.isArray((x as any).content)) return (x as any).content;
  return [];
}
