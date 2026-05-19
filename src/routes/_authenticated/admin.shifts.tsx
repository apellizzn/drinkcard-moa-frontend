import { createFileRoute } from "@tanstack/react-router";
import { Sticker } from "@/components/Sticker";
import { Plus, Clock } from "lucide-react";

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
          <Sticker color="orange" rotate={-3}>Turnos</Sticker>
          <h1 className="mt-2 font-display text-5xl">Planificación de barras</h1>
          <p className="text-xs text-muted-foreground mt-1">Demo · gestión real aún no conectada al backend</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-display text-primary-foreground sticker">
          <Plus className="h-4 w-4" /> Nuevo turno
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {SHIFTS.map((s, i) => (
          <div key={i} className="rounded-3xl border-2 bg-card p-5 sticker">
            <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /> {s.time}</div>
            <h3 className="mt-2 font-display text-2xl">{s.bar}</h3>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm">{s.people} voluntarios</span>
              <span className={`text-xs rounded-full border px-2 py-0.5 ${s.status === "Confirmado" ? "border-success text-success bg-success/10" : "border-warning text-warning bg-warning/10"}`}>
                {s.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
