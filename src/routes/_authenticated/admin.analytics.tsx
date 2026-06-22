import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Clock3,
  CreditCard,
  Flame,
  GlassWater,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { dateLocales, drinkKey } from "@/i18n/format";
import { useI18n } from "@/i18n/i18n";
import {
  listAdminTickets,
  listAllAdminPayments,
  listVolunteerUsers,
  type AdminDrinkTicketSummary,
  type AdminPaymentSummary,
  type UserSummary,
} from "@/services/api/admin-service";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AnalyticsPage,
});

const COLORS = ["#facc15", "#db2777", "#f97316", "#0ea5e9", "#22c55e"];

function AnalyticsPage() {
  const { language, t } = useI18n();
  const tickets = useQuery({
    queryKey: ["admin", "tickets", "analytics"],
    queryFn: () => listAdminTickets({ size: 500 }),
  });
  const payments = useQuery({
    queryKey: ["admin", "payments", "analytics"],
    queryFn: () => listAllAdminPayments({ status: "SUCCESS" }),
  });
  const users = useQuery({
    queryKey: ["admin", "users", "analytics"],
    queryFn: () => listVolunteerUsers(500),
  });

  const ticketList = tickets.data?.content ?? [];
  const paymentList = payments.data ?? [];
  const userList = users.data?.content ?? [];
  const consumedTickets = ticketList.filter((ticket) => ticket.status === "CONSUMED");

  const hourly = hourlyBuckets(consumedTickets);
  const drinkData = drinkMix(consumedTickets, t);
  const revenueData = revenueByDay(paymentList, language);
  const ranking = topVolunteers(consumedTickets, userList, t("common.volunteer"));
  const totalRevenue = paymentList.reduce((sum, payment) => sum + (payment.amount ?? 0), 0);
  const peakHour = peak(hourly);
  const topDrink = drinkData[0]?.name ?? t("admin.noData");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">{t("admin.nav.analytics")}</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-950">{t("admin.analyticsTitle")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("admin.analyticsSubtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Insight
          icon={GlassWater}
          label={t("admin.servedDrinks")}
          value={consumedTickets.length}
          tone="green"
        />
        <Insight
          icon={CreditCard}
          label={t("admin.confirmedRevenue")}
          value={`${totalRevenue.toFixed(2)} €`}
          tone="blue"
        />
        <Insight
          icon={Clock3}
          label={t("admin.peakHour")}
          value={ticketList.length ? `${peakHour}h` : "-"}
          tone="amber"
        />
        <Insight icon={Flame} label={t("admin.topDrink")} value={topDrink} tone="pink" />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <section className="admin-panel p-5 xl:col-span-3">
          <PanelHeader title={t("admin.revenueByDay")} subtitle={t("admin.revenueByDayDesc")} />
          <RevenueChart
            data={revenueData}
            label={t("admin.revenueByDay")}
            emptyLabel={t("admin.chartEmpty")}
          />
        </section>

        <section className="admin-panel p-5 xl:col-span-2">
          <PanelHeader title={t("admin.drinkMix")} subtitle={t("admin.drinkMixDesc")} />
          <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr] xl:grid-cols-1">
            <DrinkDonut
              data={drinkData}
              label={t("admin.drinkMix")}
              ticketsLabel={t("admin.chartTickets")}
              emptyLabel={t("admin.chartEmpty")}
            />
            <div className="space-y-3">
              {drinkData.map((drink, index) => (
                <LegendRow
                  key={drink.name}
                  color={COLORS[index % COLORS.length]}
                  label={drink.name}
                  value={drink.count}
                  suffix={`${drink.percent}%`}
                />
              ))}
              {drinkData.length === 0 && <EmptyText>{t("admin.noConsumedDrinks")}</EmptyText>}
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <section className="admin-panel p-5 xl:col-span-3">
          <PanelHeader title={t("admin.drinksByHour")} subtitle={t("admin.drinksByHourDesc")} />
          <HourlyBars data={hourly} />
        </section>

        <section className="admin-panel p-5 xl:col-span-2">
          <PanelHeader title={t("admin.topVolunteers")} subtitle={t("admin.topVolunteersDesc")} />
          <div className="mt-5 space-y-4">
            {ranking.map((volunteer, index) => (
              <div key={volunteer.volunteerId}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-slate-950">
                    {index + 1}. {volunteer.name}
                  </span>
                  <span className="font-semibold text-slate-600">{volunteer.count}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-950"
                    style={{ width: `${volunteer.percent}%` }}
                  />
                </div>
              </div>
            ))}
            {ranking.length === 0 && <EmptyText>{t("admin.noRankingData")}</EmptyText>}
          </div>
        </section>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <SmallRead
          icon={TrendingUp}
          label={t("admin.averageTicket")}
          value={paymentList.length ? `${(totalRevenue / paymentList.length).toFixed(2)} €` : "-"}
        />
        <SmallRead
          icon={Users}
          label={t("admin.volunteersWithConsumption")}
          value={ranking.length}
        />
        <SmallRead icon={Clock3} label={t("admin.analyzedTickets")} value={ticketList.length} />
      </section>
    </div>
  );
}

function Insight({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: "green" | "blue" | "amber" | "pink";
}) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    pink: "bg-pink-50 text-pink-700",
  };

  return (
    <div className="admin-panel p-5">
      <div className={`grid h-10 w-10 place-items-center rounded-lg ${colors[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 truncate text-3xl font-semibold text-slate-950">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}

function PanelHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function LegendRow({
  color,
  label,
  value,
  suffix,
}: {
  color: string;
  label: string;
  value: number;
  suffix: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="truncate text-sm font-medium text-slate-700">{label}</span>
      </div>
      <span className="shrink-0 text-sm font-semibold text-slate-950">
        {value} · {suffix}
      </span>
    </div>
  );
}

function SmallRead({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  return (
    <div className="admin-panel flex items-center gap-4 p-4">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-semibold text-slate-950">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function RevenueChart({
  data,
  label,
  emptyLabel,
}: {
  data: Array<{ label: string; revenue: number }>;
  label: string;
  emptyLabel: string;
}) {
  const max = Math.max(1, ...data.map((item) => item.revenue));
  const width = 640;
  const height = 220;
  const padX = 18;
  const padY = 18;
  const step = data.length > 1 ? (width - padX * 2) / (data.length - 1) : width - padX * 2;
  const points = data.map((item, index) => {
    const x = padX + index * step;
    const y = height - padY - (item.revenue / max) * (height - padY * 2);
    return { ...item, x, y };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = points.length
    ? `${padX},${height - padY} ${line} ${width - padX},${height - padY}`
    : "";

  return (
    <div className="mt-5">
      <div className="h-72 rounded-xl bg-slate-50 p-3">
        {points.length ? (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-full w-full"
            role="img"
            aria-label={label}
          >
            {[0, 1, 2, 3].map((lineIndex) => {
              const y = padY + lineIndex * ((height - padY * 2) / 3);
              return (
                <line
                  key={lineIndex}
                  x1={padX}
                  x2={width - padX}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              );
            })}
            <polygon points={area} fill="#10b981" opacity="0.14" />
            <polyline
              points={line}
              fill="none"
              stroke="#059669"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((point) => (
              <g key={point.label}>
                <circle cx={point.x} cy={point.y} r="5" fill="#059669" />
                <text x={point.x} y={height - 3} textAnchor="middle" fontSize="11" fill="#64748b">
                  {point.label}
                </text>
              </g>
            ))}
          </svg>
        ) : (
          <ChartEmpty>{emptyLabel}</ChartEmpty>
        )}
      </div>
    </div>
  );
}

function DrinkDonut({
  data,
  label,
  ticketsLabel,
  emptyLabel,
}: {
  data: Array<{ name: string; count: number; percent: number }>;
  label: string;
  ticketsLabel: string;
  emptyLabel: string;
}) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  let offset = 25;

  return (
    <div className="grid h-56 place-items-center rounded-xl bg-slate-50">
      {total ? (
        <svg viewBox="0 0 120 120" className="h-48 w-48" role="img" aria-label={label}>
          <circle cx="60" cy="60" r="38" fill="none" stroke="#e2e8f0" strokeWidth="18" />
          {data.map((item, index) => {
            const length = (item.count / total) * 238.76;
            const dash = `${length} ${238.76 - length}`;
            const currentOffset = offset;
            offset -= length;
            return (
              <circle
                key={item.name}
                cx="60"
                cy="60"
                r="38"
                fill="none"
                stroke={COLORS[index % COLORS.length]}
                strokeWidth="18"
                strokeDasharray={dash}
                strokeDashoffset={currentOffset}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
            );
          })}
          <text
            x="60"
            y="56"
            textAnchor="middle"
            className="fill-slate-950 text-[18px] font-semibold"
          >
            {total}
          </text>
          <text x="60" y="72" textAnchor="middle" className="fill-slate-500 text-[9px]">
            {ticketsLabel}
          </text>
        </svg>
      ) : (
        <ChartEmpty>{emptyLabel}</ChartEmpty>
      )}
    </div>
  );
}

function HourlyBars({ data }: { data: Array<{ hour: number; label: string; count: number }> }) {
  const max = Math.max(1, ...data.map((item) => item.count));

  return (
    <div className="mt-5 h-72 rounded-xl bg-slate-50 p-4">
      <div className="flex h-full items-end gap-1.5">
        {data.map((item) => (
          <div key={item.hour} className="flex h-full flex-1 flex-col justify-end gap-2">
            <div className="flex flex-1 items-end">
              <div
                className="w-full rounded-t-lg bg-slate-950 transition-all"
                style={{
                  height: `${Math.max(4, (item.count / max) * 100)}%`,
                  opacity: item.count ? 1 : 0.12,
                }}
                title={`${item.label}: ${item.count}`}
              />
            </div>
            <span className="text-center text-[10px] text-slate-500">
              {item.hour % 2 === 0 ? item.label : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartEmpty({ children }: { children: React.ReactNode }) {
  return <div className="grid h-full place-items-center text-sm text-slate-500">{children}</div>;
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-500">{children}</p>;
}

function hourlyBuckets(tickets: AdminDrinkTicketSummary[]) {
  const counts = Array.from({ length: 24 }, (_, hour) => ({ hour, label: `${hour}h`, count: 0 }));
  tickets.forEach((ticket) => {
    const date = ticket.consumedAt ?? ticket.createdAt;
    if (!date) return;
    counts[new Date(date).getHours()].count += 1;
  });
  return counts;
}

function drinkMix(tickets: AdminDrinkTicketSummary[], t: ReturnType<typeof useI18n>["t"]) {
  const counts = tickets.reduce<Record<string, number>>((acc, ticket) => {
    acc[ticket.drinkType] = (acc[ticket.drinkType] ?? 0) + 1;
    return acc;
  }, {});
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  if (!total) return [];
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([drinkType, count]) => ({
      name: t(drinkKey(drinkType)),
      count,
      percent: Math.round((count / total) * 100),
    }));
}

function revenueByDay(
  payments: AdminPaymentSummary[],
  language: ReturnType<typeof useI18n>["language"],
) {
  const buckets = new Map<string, { date: string; label: string; revenue: number }>();
  payments.forEach((payment) => {
    const rawDate = payment.paidAt ?? payment.createdAt;
    if (!rawDate) return;
    const date = new Date(rawDate);
    const key = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString(dateLocales[language].code, {
      day: "2-digit",
      month: "short",
    });
    const current = buckets.get(key) ?? { date: key, label, revenue: 0 };
    current.revenue += payment.amount ?? 0;
    buckets.set(key, current);
  });

  return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-10);
}

function topVolunteers(
  tickets: AdminDrinkTicketSummary[],
  users: UserSummary[],
  fallbackName: string,
) {
  const names = new Map(
    users.map((user) => [user.userId, user.fullName || user.email || user.userId]),
  );
  const counts = tickets.reduce<Record<string, number>>((acc, ticket) => {
    acc[ticket.volunteerId] = (acc[ticket.volunteerId] ?? 0) + 1;
    return acc;
  }, {});
  const max = Math.max(1, ...Object.values(counts));

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([volunteerId, count]) => ({
      volunteerId,
      count,
      name: names.get(volunteerId) ?? fallbackName,
      percent: Math.max(8, Math.round((count / max) * 100)),
    }));
}

function peak(buckets: Array<{ hour: number; count: number }>) {
  return (
    buckets.reduce((best, current) => (current.count > best.count ? current : best), buckets[0])
      ?.hour ?? 0
  );
}
