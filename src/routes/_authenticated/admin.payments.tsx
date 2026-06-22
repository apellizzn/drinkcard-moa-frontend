import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, type Locale } from "date-fns";
import { ExternalLink, RefreshCw } from "lucide-react";
import { useState } from "react";
import {
  AdminDataTable,
  AdminEmptyRow,
  AdminStatusBadge,
  AdminTable,
} from "@/components/admin/AdminDataTable";
import { listAdminPayments } from "@/services/api/admin-service";
import { resultCount, translateNow, translateStatus } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n-react";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  component: AdminPaymentsPage,
  head: () => ({ meta: [{ title: `${translateNow("admin.nav.payments")} — Admin MOA` }] }),
});

function AdminPaymentsPage() {
  const [status, setStatus] = useState("");
  const [volunteerId, setVolunteerId] = useState("");
  const { language, t, dateLocale } = useLanguage();
  const payments = useQuery({
    queryKey: ["admin", "payments", "page", status, volunteerId],
    queryFn: () => listAdminPayments({ status, volunteerId, size: 50 }),
  });

  const list = payments.data?.content ?? [];
  const total = list.reduce(
    (sum, payment) => sum + (payment.status === "SUCCESS" ? (payment.amount ?? 0) : 0),
    0,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{t("admin.nav.payments")}</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">
            {t("admin.payments.sumup")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("admin.common.confirmedTotal", { amount: total.toFixed(2) })}
          </p>
        </div>
        <button
          onClick={() => payments.refetch()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" /> {t("common.refresh")}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <input
          value={volunteerId}
          onChange={(e) => setVolunteerId(e.target.value)}
          placeholder={t("admin.common.volunteerIdFilter")}
          className="input bg-white"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input bg-white"
        >
          <option value="">{t("admin.common.allStatuses")}</option>
          <option value="SUCCESS">{translateStatus(language, "SUCCESS")}</option>
          <option value="PENDING">{translateStatus(language, "PENDING")}</option>
          <option value="FAILED">{translateStatus(language, "FAILED")}</option>
          <option value="EXPIRED">{translateStatus(language, "EXPIRED")}</option>
        </select>
      </div>

      <AdminDataTable
        title={t("admin.payments.registered")}
        description={resultCount(language, list.length)}
      >
        <AdminTable>
          <thead>
            <tr>
              <th>{t("admin.common.created")}</th>
              <th>{t("admin.common.volunteer")}</th>
              <th className="text-right">{t("admin.common.amount")}</th>
              <th>{t("admin.common.paid")}</th>
              <th>{t("admin.common.checkout")}</th>
              <th>{t("admin.common.state")}</th>
            </tr>
          </thead>
          <tbody>
            {payments.isLoading && (
              <AdminEmptyRow colSpan={6}>{t("admin.payments.loading")}</AdminEmptyRow>
            )}
            {!payments.isLoading && list.length === 0 && (
              <AdminEmptyRow colSpan={6}>{t("admin.payments.empty")}</AdminEmptyRow>
            )}
            {list.map((payment) => (
              <tr key={payment.paymentId}>
                <td>{fmt(payment.createdAt, dateLocale)}</td>
                <td className="font-mono text-xs">{short(payment.volunteerId)}</td>
                <td className="text-right font-medium text-slate-950">
                  {(payment.amount ?? 0).toFixed(2)} €
                </td>
                <td>{payment.paidAt ? fmt(payment.paidAt, dateLocale) : "—"}</td>
                <td>
                  {payment.providerCheckoutUrl ? (
                    <a
                      href={payment.providerCheckoutUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {t("admin.common.open")} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td>
                  <AdminStatusBadge status={payment.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      </AdminDataTable>
    </div>
  );
}

function fmt(value: string | null | undefined, locale: Locale) {
  return value ? format(new Date(value), "d MMM HH:mm", { locale }) : "—";
}

function short(value?: string | null) {
  return value ? `${value.slice(0, 8)}…` : "—";
}
