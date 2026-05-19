import { createFileRoute } from "@tanstack/react-router";
import { Sticker } from "@/components/Sticker";

const HOURLY = [4, 8, 12, 18, 24, 30, 42, 56, 70, 88, 95, 80, 60, 40, 25, 12];

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const max = Math.max(...HOURLY);
  return (
    <div className="space-y-6">
      <div>
        <Sticker color="violet" rotate={-3}>Analíticas</Sticker>
        <h1 className="mt-2 font-display text-5xl">Consumiciones por hora</h1>
        <p className="text-xs text-muted-foreground mt-1">Demo · endpoint en tiempo real pendiente</p>
      </div>

      <div className="rounded-3xl border-2 bg-card p-6 sticker">
        <div className="flex items-end gap-2 h-64">
          {HOURLY.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-lg bg-gradient-to-t from-primary to-accent" style={{ height: `${(v / max) * 100}%` }} aria-label={`Hora ${i + 14}: ${v}`} />
              <span className="text-[10px] text-muted-foreground">{(14 + i) % 24}h</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border-2 bg-card p-6 sticker">
        <h2 className="font-display text-2xl">Notas operativas</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>Pico de consumo previsto entre 23h y 01h.</li>
          <li>Refuerzo recomendado en barra escenario durante el horario de cabezas de cartel.</li>
          <li>El consumo de agua se dispara con temperaturas altas — tener stock extra.</li>
        </ul>
      </div>
    </div>
  );
}
