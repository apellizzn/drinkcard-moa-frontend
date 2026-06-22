import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import {
  AdminDataTable,
  AdminEmptyRow,
  AdminStatusBadge,
  AdminTable,
} from "@/components/admin/AdminDataTable";
import { listAdminTickets } from "@/services/api/admin-service";
import { useI18n } from "@/i18n/i18n";
import { dateLocales, drinkKey } from "@/i18n/format";

export const Route = createFileRoute("/_authenticated/admin/tickets")({
  component: AdminTicketsPage,
  head: () => ({ meta: [{ title: "Tickets — Admin MOA" }] }),
});

function AdminTicketsPage() {
  const { language, t } = useI18n();
  const [status, setStatus] = useState("");
  const [volunteerId, setVolunteerId] = useState("");
  const tickets = useQuery({
    queryKey: ["admin", "tickets", status, volunteerId],
    queryFn: () => listAdminTickets({ status, volunteerId, size: 50 }),
  });

  const list = tickets.data?.content ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{t("admin.nav.tickets")}</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">{t("admin.ticketsTitle")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("admin.ticketsDesc")}</p>
        </div>
        <button
          onClick={() => tickets.refetch()}
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
          <option value="PENDING">PENDING</option>
          <option value="CONSUMED">CONSUMED</option>
          <option value="EXPIRED">EXPIRED</option>
        </select>
      </div>

      <AdminDataTable
        title={t("admin.issuedTickets")}
        description={t("common.results", {
          count: list.length,
          suffix: list.length === 1 ? "" : "s",
        })}
      >
        <AdminTable>
          <thead>
            <tr>
              <th>{t("common.date")}</th>
              <th>{t("admin.drink")}</th>
              <th>{t("common.volunteer")}</th>
              <th>{t("common.staff")}</th>
              <th>{t("admin.expires")}</th>
              <th>{t("common.status")}</th>
            </tr>
          </thead>
          <tbody>
            {tickets.isLoading && (
              <AdminEmptyRow colSpan={6}>{t("admin.loadingTickets")}</AdminEmptyRow>
            )}
            {!tickets.isLoading && list.length === 0 && (
              <AdminEmptyRow colSpan={6}>{t("admin.noTickets")}</AdminEmptyRow>
            )}
            {list.map((ticket) => (
              <tr key={ticket.drinkTicketId}>
                <td>{fmt(ticket.createdAt, language)}</td>
                <td className="font-medium text-slate-950">{t(drinkKey(ticket.drinkType))}</td>
                <td className="font-mono text-xs">{short(ticket.volunteerId)}</td>
                <td className="font-mono text-xs">
                  {ticket.consumedByStaffId ? short(ticket.consumedByStaffId) : "—"}
                </td>
                <td>{ticket.expiresAt ? fmt(ticket.expiresAt, language) : "—"}</td>
                <td>
                  <AdminStatusBadge status={ticket.status} />
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
