import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Sticker } from "@/components/Sticker";
import { CreditCard, Users, Wallet, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface User { id: string; firstName?: string; lastName?: string; email: string; role: string; status: string }
interface Account { volunteerId: string; credits: number; status: string }
interface Payment { id: string; volunteerId: string; amountEur?: number; amount?: number; status: string; createdAt: string }

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const users = useQuery<{ content?: User[] } | User[]>({ queryKey: ["admin", "users"], queryFn: () => api("/api/v1/admin/users?role=VOLUNTEER&size=200") });
  const accounts = useQuery<Account[] | { content?: Account[] }>({ queryKey: ["admin", "accounts"], queryFn: () => api("/api/v1/admin/drink-card-accounts") });
  const payments = useQuery<{ content?: Payment[] } | Payment[]>({ queryKey: ["admin", "payments"], queryFn: () => api("/api/v1/admin/payments?size=10&sort=createdAt,desc") });

  const userList = arr<User>(users.data);
  const accList = arr<Account>(accounts.data);
  const payList = arr<Payment>(payments.data);
  const activeCards = accList.filter((a) => a.status === "ACTIVE").length;
  const totalCredits = accList.reduce((s, a) => s + (a.credits || 0), 0);
  const successPays = payList.filter((p) => p.status === "SUCCESS");
  const revenue = successPays.reduce((s, p) => s + (p.amountEur ?? p.amount ?? 0), 0);

  const mix = [
    { label: "Cerveza", value: 42, color: "bg-neon-yellow" },
    { label: "Vino", value: 26, color: "bg-neon-pink" },
    { label: "Refresco", value: 20, color: "bg-neon-orange" },
    { label: "Agua", value: 12, color: "bg-neon-cyan" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Sticker color="pink" rotate={-3}>Dashboard</Sticker>
        <h1 className="mt-2 font-display text-5xl">Vista general</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={CreditCard} label="Tarjetas activas" value={activeCards} accent="primary" />
        <Kpi icon={Wallet} label="Créditos en circulación" value={totalCredits} accent="secondary" />
        <Kpi icon={Users} label="Voluntarios" value={userList.length} accent="accent" />
        <Kpi icon={TrendingUp} label="Ingresos (€)" value={revenue.toFixed(2)} accent="neon-lime" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border-2 bg-card p-5 sticker">
          <h2 className="font-display text-2xl mb-3">Pagos recientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-2">Fecha</th><th>Voluntario</th><th>Importe</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {payList.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Sin pagos aún.</td></tr>}
                {payList.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="py-2">{p.createdAt ? format(new Date(p.createdAt), "d MMM HH:mm") : "—"}</td>
                    <td className="font-mono text-xs">{p.volunteerId?.slice(0, 8)}…</td>
                    <td>{(p.amountEur ?? p.amount ?? 10).toFixed?.(2) ?? "10.00"} €</td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-3xl border-2 bg-card p-5 sticker">
          <h2 className="font-display text-2xl mb-1">Mezcla de bebidas</h2>
          <p className="text-xs text-muted-foreground mb-3">Demo · pendiente endpoint</p>
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

function Kpi({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent: string }) {
  return (
    <div className="rounded-3xl border-2 bg-card p-5 sticker">
      <Icon className={`h-7 w-7 text-${accent}`} />
      <div className="mt-2 font-display text-4xl">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SUCCESS: "bg-success/20 text-success border-success",
    PENDING: "bg-warning/20 text-warning border-warning",
    FAILED: "bg-destructive/20 text-destructive border-destructive",
    EXPIRED: "bg-muted text-muted-foreground border-border",
  };
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted"}`}>{status}</span>;
}

function arr<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  if (x && typeof x === "object" && "content" in (x as any) && Array.isArray((x as any).content)) return (x as any).content;
  return [];
}
