import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  Mail,
  ReceiptText,
  TicketCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  AdminStats,
  getAdminStats,
  inviteUser,
  listVolunteerUsers,
  type UserSummary,
} from "@/services/api/admin-service";
import { ApiError } from "@/services/api/http-client";
import { translateDrink } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { language, t } = useLanguage();
  const users = useQuery({ queryKey: ["admin", "users"], queryFn: () => listVolunteerUsers(200) });
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: getAdminStats });
  const userList = arr<UserSummary>(users.data);
  const activeCards = stats.data?.totalActiveCards ?? 0;
  const totalCredits = stats.data?.totalAvailableCredits ?? 0;
  const revenue = stats.data?.totalSuccessfulPaymentsAmount ?? 0;
  const volunteersRanking = stats.data?.topVolunteers ?? [];
  const drinkConsumptions = stats.data?.drinkConsumptions ?? [];
  const paymentsCount = stats.data?.totalSuccessfulPayments ?? 0;

  const mix = drinkMix(drinkConsumptions, language);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">{t("admin.nav.dashboard")}</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-950">
          {t("admin.dashboard.overview")}
        </h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={CreditCard}
          label={t("admin.dashboard.activeCards")}
          value={activeCards}
          accent="red"
        />
        <Kpi
          icon={Wallet}
          label={t("admin.dashboard.creditsInCirculation")}
          value={totalCredits}
          accent="amber"
        />
        <Kpi
          icon={Users}
          label={t("admin.dashboard.volunteers")}
          value={userList.length}
          accent="blue"
        />
        <Kpi
          icon={TrendingUp}
          label={t("admin.dashboard.confirmedRevenue")}
          value={stats.isLoading ? "..." : revenue.toFixed(2)}
          accent="green"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MiniMetric
          icon={TicketCheck}
          label={t("admin.dashboard.consumedDrinks")}
          value={drinkConsumptions.length}
          tone="green"
        />
        <MiniMetric
          icon={ReceiptText}
          label={t("admin.dashboard.paymentsProcessed")}
          value={paymentsCount}
          tone="amber"
        />
      </div>

      <InviteCard />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="admin-panel p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-950">
            {t("admin.dashboard.drinkMix")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{t("admin.dashboard.drinkMixSubtitle")}</p>
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
            {mix.length === 0 && (
              <p className="text-sm text-slate-500">{t("admin.dashboard.noConsumption")}</p>
            )}
          </div>
        </section>

        <div className="admin-panel p-5">
          <h2 className="text-base font-semibold text-slate-950">
            {t("admin.dashboard.topVolunteers")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("admin.dashboard.topVolunteersSubtitle")}
          </p>
          <div className="mt-5 space-y-3">
            {volunteersRanking.map((v, index) => (
              <div
                key={v.volunteer.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-950">
                    {index + 1}. {`${v.volunteer.firstName} ${v.volunteer.lastName}` || v.volunteer.email || v.volunteer.id}
                  </p>
                  <p className="font-mono text-xs text-slate-500">{v.volunteer.id.slice(0, 8)}...</p>
                </div>
                <span className="text-lg font-semibold text-slate-950">{v.drinkTicketsCount}</span>
              </div>
            ))}
            {volunteersRanking.length === 0 && (
              <p className="text-sm text-slate-500">{t("admin.dashboard.noConsumptionData")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function drinkMix(
  drinkConsumptions: AdminStats["drinkConsumptions"],
  language: Parameters<typeof translateDrink>[0],
) {
  const colors = [
    "bg-neon-yellow",
    "bg-neon-pink",
    "bg-neon-orange",
    "bg-neon-cyan",
    "bg-neon-lime",
  ];
  
  const total = drinkConsumptions.reduce((sum, d) => sum + d.drinkTicketsCount, 0);
  if (!total) return [];
  return drinkConsumptions
    .map(({ drinkType: drink, drinkTicketsCount: count }, index) => ({
      label: translateDrink(language, drink),
      count,
      value: Math.round((count / total) * 100),
      color: colors[index % colors.length],
    }));
}


function Kpi({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent: "red" | "amber" | "blue" | "green";
}) {
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

function MiniMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  tone: "green" | "amber" | "slate";
}) {
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
  if (x && typeof x === "object" && "content" in x) {
    const content = (x as { content?: unknown }).content;
    if (Array.isArray(content)) return content as T[];
  }
  return [];
}

type InviteForm = { email: string };

function InviteCard() {
  const { t } = useLanguage();
  const inviteSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("validation.email")),
      }),
    [t],
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      await inviteUser({ email, role: "VOLUNTEER" });
      toast.success(t("admin.dashboard.inviteSent", { email }));
      reset();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t("admin.dashboard.inviteError");
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
          <h2 className="text-base font-semibold text-slate-950">{t("admin.dashboard.invite")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("admin.dashboard.inviteDescription")}</p>
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
          {isSubmitting ? t("admin.dashboard.inviteLoading") : t("admin.dashboard.inviteButton")}
        </button>
      </form>
    </section>
  );
}
