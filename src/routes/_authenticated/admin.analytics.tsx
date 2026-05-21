import { createFileRoute } from "@tanstack/react-router";

const HOURLY = [4, 8, 12, 18, 24, 30, 42, 56, 70, 88, 95, 80, 60, 40, 25, 12];

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const max = Math.max(...HOURLY);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Analíticas</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-950">Consumiciones por hora</h1>
        <p className="mt-1 text-sm text-slate-500">Demo · endpoint en tiempo real pendiente</p>
      </div>

      <div className="admin-panel p-6">
        <div className="flex items-end gap-2 h-64">
          {HOURLY.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t bg-slate-800" style={{ height: `${(v / max) * 100}%` }} aria-label={`Hora ${i + 14}: ${v}`} />
              <span className="text-[10px] text-slate-500">{(14 + i) % 24}h</span>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-panel p-6">
        <h2 className="text-base font-semibold text-slate-950">Notas operativas</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc list-inside">
          <li>Pico de consumo previsto entre 23h y 01h.</li>
          <li>Refuerzo recomendado en barra escenario durante el horario de cabezas de cartel.</li>
          <li>El consumo de agua se dispara con temperaturas altas — tener stock extra.</li>
        </ul>
      </div>
    </div>
  );
}
