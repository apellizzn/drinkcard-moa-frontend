import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AdminDataTable, AdminStatusBadge, AdminTable } from "@/components/admin/AdminDataTable";

export const Route = createFileRoute("/_authenticated/admin/shifts")({
  component: ShiftsPage,
});

const SHIFTS = [
  { time: "17:00 – 20:00", bar: "Barra principal", people: 4, status: "Confirmado" },
  { time: "20:00 – 23:00", bar: "Barra escenario", people: 6, status: "Confirmado" },
  { time: "23:00 – 02:00", bar: "Barra VIP", people: 3, status: "Pendiente" },
  { time: "02:00 – 05:00", bar: "Barra principal", people: 5, status: "Pendiente" },
];

function ShiftsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Turnos</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Planificación de barras</h1>
          <p className="mt-1 text-sm text-slate-500">Demo · gestión real aún no conectada al backend</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          <Plus className="h-4 w-4" /> Nuevo turno
        </button>
      </div>

      <AdminDataTable title="Turnos programados" description="Vista operativa por franja y barra">
        <AdminTable>
          <thead>
            <tr><th>Horario</th><th>Barra</th><th className="text-right">Voluntarios</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {SHIFTS.map((s, i) => (
              <tr key={i}>
                <td className="font-medium text-slate-950">{s.time}</td>
                <td>{s.bar}</td>
                <td className="text-right font-semibold text-slate-950">{s.people}</td>
                <td><AdminStatusBadge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      </AdminDataTable>
    </div>
  );
}
