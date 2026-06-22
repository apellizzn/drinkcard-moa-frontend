import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CreditCard, Mail, ReceiptText, TicketCheck, TrendingUp, Users, Wallet } from "lucide-react";
import {
  inviteUser,
  listDrinkCardAccounts,
  listAllAdminPayments,
  listAdminTickets,
  listVolunteerUsers,
  type AdminDrinkTicketSummary,
  type PageResponse,
  type UserSummary,
} from "@/services/api/admin-service";
import type { DrinkCardAccount } from "@/services/api/drink-card-service";
import { ApiError } from "@/services/api/http-client";

type AccountResponse = DrinkCardAccount[] | PageResponse<DrinkCardAccount>;

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const users = useQuery({ queryKey: ["admin", "users"], queryFn: () => listVolunteerUsers(200) });
  const accounts = useQuery({ queryKey: ["admin", "accounts"], queryFn: listDrinkCardAccounts });
  const revenuePayments = useQuery({ queryKey: ["admin", "payments", "revenue"], queryFn: () => listAllAdminPayments({ status: "SUCCESS" }) });
  const tickets = useQuery({ queryKey: ["admin", "tickets", "dashboard"], queryFn: () => listAdminTickets({ size: 500 }) });

  const userList = arr<UserSummary>(users.data);
  const accList = arr<DrinkCardAccount>(accounts.data as AccountResponse | undefined);
  const revenuePayList = revenuePayments.data ?? [];
  const ticketList = arr<AdminDrinkTicketSummary>(tickets.data);
  const consumedTickets = ticketList.filter((ticket) => ticket.status === "CONSUMED");
  const activeCards = accList.filter((a) => a.status === "ACTIVE").length;
  const totalCredits = accList.reduce((s, a) => s + (a.credits || 0), 0);
  const revenue = revenuePayList.reduce((s, p) => s + (p.amount ?? 0), 0);

  const mix = drinkMix(consumedTickets);
  const volunteerRanking = topVolunteers(consumedTickets, userList);

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
        <Kpi icon={TrendingUp} label="Ingresos confirmados (€)" value={revenuePayments.isLoading ? "..." : revenue.toFixed(2)} accent="green" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MiniMetric icon={TicketCheck} label="Consumiciones servidas" value={consumedTickets.length} tone="green" />
        <MiniMetric icon={ReceiptText} label="Pagos procesados" value={revenuePayList.length} tone="amber" />
      </div>

      <InviteCard />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="admin-panel p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-950">Bebidas consumidas</h2>
          <p className="mt-1 text-sm text-slate-500">Cantidad y porcentaje sobre tickets canjeados.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {mix.map((m) => (
              <div key={m.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{m.label}</p>
                    <p className="mt-1 text-3xl font-semibold text-slate-950">{m.count}</p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-slate-500">{m.value}%</span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full ${m.color}`} style={{ width: `${m.value}%` }} />
                </div>
              </div>
            ))}
            {mix.length === 0 && <p className="text-sm text-slate-500">Sin consumiciones canjeadas todavía.</p>}
          </div>
        </section>

        <div className="admin-panel p-5">
          <h2 className="text-base font-semibold text-slate-950">Voluntarios con más consumos</h2>
          <p className="mt-1 text-sm text-slate-500">Ranking por tickets canjeados.</p>
          <div className="mt-5 space-y-3">
            {volunteerRanking.map((v, index) => (
              <div key={v.volunteerId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-950">{index + 1}. {v.name}</p>
                  <p className="font-mono text-xs text-slate-500">{v.volunteerId.slice(0, 8)}...</p>
                </div>
                <span className="text-lg font-semibold text-slate-950">{v.count}</span>
              </div>
            ))}
            {volunteerRanking.length === 0 && <p className="text-sm text-slate-500">Sin datos de consumo todavía.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function drinkMix(tickets: AdminDrinkTicketSummary[]) {
  const labels: Record<string, string> = { BEER: "Cerveza", WINE: "Vino", SOFT_DRINK: "Refresco", WATER: "Agua" };
  const colors = ["bg-neon-yellow", "bg-neon-pink", "bg-neon-orange", "bg-neon-cyan", "bg-neon-lime"];
  const counts = tickets.reduce<Record<string, number>>((acc, ticket) => {
    acc[ticket.drinkType] = (acc[ticket.drinkType] ?? 0) + 1;
    return acc;
  }, {});
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  if (!total) return [];
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([drink, count], index) => ({
      label: labels[drink] ?? drink,
      count,
      value: Math.round((count / total) * 100),
      color: colors[index % colors.length],
    }));
}

function topVolunteers(tickets: AdminDrinkTicketSummary[], users: UserSummary[]) {
  const names = new Map(users.map((u) => [u.userId, u.fullName || u.email || u.userId]));
  const counts = tickets.reduce<Record<string, number>>((acc, ticket) => {
    acc[ticket.volunteerId] = (acc[ticket.volunteerId] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([volunteerId, count]) => ({
      volunteerId,
      count,
      name: names.get(volunteerId) ?? "Voluntario",
    }));
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

function MiniMetric({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number | string; tone: "green" | "amber" | "slate" }) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="admin-panel flex items-center gap-4 p-4">
      <div className={`grid h-10 w-10 place-items-center rounded-lg ${colors[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-semibold text-slate-950">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function arr<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  if (x && typeof x === "object" && "content" in (x as any) && Array.isArray((x as any).content)) return (x as any).content;
  return [];
}

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
});
type InviteForm = z.infer<typeof inviteSchema>;

function InviteCard() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      await inviteUser({ email, role: "VOLUNTEER" });
      toast.success(`Invitación enviada a ${email}`);
      reset();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error al enviar la invitación";
      toast.error(msg);
    }
  });

  return (
    <section className="admin-panel p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-600">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-950">Invitar voluntario</h2>
          <p className="mt-1 text-sm text-slate-500">Envía un enlace de registro al email indicado.</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <input
            type="email"
            placeholder="email@ejemplo.com"
            autoComplete="email"
            disabled={isSubmitting}
            {...register("email")}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-60"
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {isSubmitting ? "Enviando..." : "Enviar invitación"}
        </button>
      </form>
    </section>
  );
}
