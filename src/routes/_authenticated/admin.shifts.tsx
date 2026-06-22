import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AdminDataTable, AdminStatusBadge, AdminTable } from "@/components/admin/AdminDataTable";
import { useLanguage } from "@/lib/i18n-react";

export const Route = createFileRoute("/_authenticated/admin/shifts")({
  component: ShiftsPage,
});

function ShiftsPage() {
  const { t } = useLanguage();
  const shifts = [
    { time: "17:00 – 20:00", bar: t("admin.shifts.barMain"), people: 4, status: "CONFIRMADO" },
    { time: "20:00 – 23:00", bar: t("admin.shifts.barStage"), people: 6, status: "CONFIRMADO" },
    { time: "23:00 – 02:00", bar: t("admin.shifts.barVip"), people: 3, status: "PENDIENTE" },
    { time: "02:00 – 05:00", bar: t("admin.shifts.barMain"), people: 5, status: "PENDIENTE" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{t("admin.nav.shifts")}</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">{t("admin.shifts.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("admin.shifts.description")}</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          <Plus className="h-4 w-4" /> {t("admin.shifts.add")}
        </button>
      </div>

      <AdminDataTable
        title={t("admin.shifts.scheduled")}
        description={t("admin.shifts.tableDescription")}
      >
        <AdminTable>
          <thead>
            <tr>
              <th>{t("admin.shifts.time")}</th>
              <th>{t("admin.shifts.bar")}</th>
              <th className="text-right">{t("admin.shifts.people")}</th>
              <th>{t("admin.common.state")}</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((s, i) => (
              <tr key={i}>
                <td className="font-medium text-slate-950">{s.time}</td>
                <td>{s.bar}</td>
                <td className="text-right font-semibold text-slate-950">{s.people}</td>
                <td>
                  <AdminStatusBadge status={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      </AdminDataTable>
    </div>
  );
}
