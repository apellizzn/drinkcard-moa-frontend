import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ExternalLink, RefreshCw } from "lucide-react";
import { useState } from "react";
import {
  AdminDataTable,
  AdminEmptyRow,
  AdminStatusBadge,
  AdminTable,
} from "@/components/admin/AdminDataTable";
import { listAdminPayments } from "@/services/api/admin-service";
import { useI18n } from "@/i18n/i18n";
import { dateLocales } from "@/i18n/format";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  component: AdminPaymentsPage,
  head: () => ({ meta: [{ title: "Pagos — Admin MOA" }] }),
});

function AdminPaymentsPage() {
  const { language, t } = useI18n();
  const [status, setStatus] = useState("");
  const [volunteerId, setVolunteerId] = useState("");
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
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">{t("admin.paymentsTitle")}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("admin.confirmedTotal", { total: total.toFixed(2) })}
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
          placeholder={t("admin.filterVolunteer")}
          className="input bg-white"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input bg-white"
        >
          <option value="">{t("admin.allStatuses")}</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="PENDING">PENDING</option>
          <option value="FAILED">FAILED</option>
          <option value="EXPIRED">EXPIRED</option>
        </select>
      </div>

      <AdminDataTable
        title={t("admin.registeredPayments")}
        description={t("common.results", {
          count: list.length,
          suffix: list.length === 1 ? "" : "s",
        })}
      >
        <AdminTable>
          <thead>
            <tr>
              <th>{t("admin.created")}</th>
              <th>{t("common.volunteer")}</th>
              <th className="text-right">{t("common.amount")}</th>
              <th>{t("admin.paid")}</th>
              <th>{t("admin.checkout")}</th>
              <th>{t("common.status")}</th>
            </tr>
          </thead>
          <tbody>
            {payments.isLoading && (
              <AdminEmptyRow colSpan={6}>{t("admin.loadingPayments")}</AdminEmptyRow>
            )}
            {!payments.isLoading && list.length === 0 && (
              <AdminEmptyRow colSpan={6}>{t("admin.noPayments")}</AdminEmptyRow>
            )}
            {list.map((payment) => (
              <tr key={payment.paymentId}>
                <td>{fmt(payment.createdAt, language)}</td>
                <td className="font-mono text-xs">{short(payment.volunteerId)}</td>
                <td className="text-right font-medium text-slate-950">
                  {(payment.amount ?? 0).toFixed(2)} €
                </td>
                <td>{payment.paidAt ? fmt(payment.paidAt, language) : "—"}</td>
                <td>
                  {payment.providerCheckoutUrl ? (
                    <a
                      href={payment.providerCheckoutUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {t("common.open")} <ExternalLink className="h-3.5 w-3.5" />
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

function fmt(value: string | null | undefined, language: ReturnType<typeof useI18n>["language"]) {
  return value ? format(new Date(value), "d MMM HH:mm", { locale: dateLocales[language] }) : "—";
}

function short(value?: string | null) {
  return value ? `${value.slice(0, 8)}…` : "—";
}
