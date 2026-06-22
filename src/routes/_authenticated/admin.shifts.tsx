import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AdminDataTable, AdminStatusBadge, AdminTable } from "@/components/admin/AdminDataTable";
import { useI18n } from "@/i18n/i18n";

export const Route = createFileRoute("/_authenticated/admin/shifts")({
  component: ShiftsPage,
});

const SHIFTS = [
  { time: "17:00 – 20:00", bar: "Main bar", people: 4, status: "SUCCESS" },
  { time: "20:00 – 23:00", bar: "Stage bar", people: 6, status: "SUCCESS" },
  { time: "23:00 – 02:00", bar: "VIP bar", people: 3, status: "PENDING" },
  { time: "02:00 – 05:00", bar: "Main bar", people: 5, status: "PENDING" },
];

function ShiftsPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{t("admin.nav.shifts")}</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">{t("admin.shiftsTitle")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("admin.shiftsDemo")}</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          <Plus className="h-4 w-4" /> {t("admin.newShift")}
        </button>
      </div>

      <AdminDataTable title={t("admin.scheduledShifts")} description={t("admin.shiftsDesc")}>
        <AdminTable>
          <thead>
            <tr>
              <th>{t("admin.schedule")}</th>
              <th>{t("admin.bar")}</th>
              <th className="text-right">{t("admin.volunteers")}</th>
              <th>{t("common.status")}</th>
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map((s, i) => (
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
