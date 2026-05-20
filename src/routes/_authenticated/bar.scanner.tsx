import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Sticker } from "@/components/Sticker";
import { Camera, CheckCircle2, XCircle, Type } from "lucide-react";
import { useSession } from "@/hooks/use-session";

interface ConsumeResponse {
  ticketId: string; status: string; drinkType: string; remainingCredits: number;
}
const LABELS: Record<string, string> = { BEER: "Cerveza", WINE: "Vino", WATER: "Agua", SOFT_DRINK: "Refresco" };

export const Route = createFileRoute("/_authenticated/bar/scanner")({
  component: ScannerPage,
  head: () => ({ meta: [{ title: "Escáner barra — DrinkCard MOA" }] }),
});

function ScannerPage() {
  const session = useSession();
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [manualValue, setManualValue] = useState("");
  const [last, setLast] = useState<{ ok: boolean; data?: ConsumeResponse; msg?: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const elRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);
  const lockRef = useRef<string | null>(null);

  const consume = async (ticketId: string) => {
    if (lockRef.current === ticketId) return;
    lockRef.current = ticketId;
    try {
      const consumedByStaffId = session?.volunteerId ?? session?.userId;
      if (!consumedByStaffId) throw new ApiError(400, "Sesión incompleta: falta el identificador del usuario");
      const res = await api<ConsumeResponse>(`/api/v1/drink-tickets/${ticketId}/consume`, {
        method: "POST",
        body: JSON.stringify({ consumedByStaffId }),
      });
      setLast({ ok: true, data: res });
    } catch (e) {
      setLast({ ok: false, msg: e instanceof ApiError ? e.message : "Ticket no válido" });
    } finally {
      setTimeout(() => { lockRef.current = null; }, 2500);
    }
  };

  useEffect(() => {
    if (mode !== "camera" || !elRef.current) return;
    let stopped = false;
    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      const id = "qr-scan-region";
      if (elRef.current) elRef.current.id = id;
      const scanner = new Html5Qrcode(id);
      scannerRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            try {
              const parsed = JSON.parse(decoded);
              if (parsed?.ticketId) consume(parsed.ticketId);
            } catch {
              if (decoded) consume(decoded);
            }
          },
          () => {},
        );
        if (!stopped) setScanning(true);
      } catch {
        setMode("manual");
      }
    })();
    return () => {
      stopped = true;
      setScanning(false);
      const s = scannerRef.current;
      if (s && s.isScanning) s.stop().then(() => s.clear()).catch(() => {});
    };
  }, [mode]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Sticker color="cyan" rotate={-4}>Modo barra</Sticker>
      <h1 className="mt-3 font-display text-5xl">Escáner QR</h1>
      <p className="text-muted-foreground mt-1">Escanea el QR del voluntario para servir su bebida.</p>

      <div className="mt-6 inline-flex rounded-xl border-2 p-1 bg-card">
        <button onClick={() => setMode("camera")} className={`px-4 py-2 rounded-lg font-display text-sm ${mode === "camera" ? "bg-primary text-primary-foreground" : ""}`}>
          <Camera className="inline h-4 w-4 mr-1" /> Cámara
        </button>
        <button onClick={() => setMode("manual")} className={`px-4 py-2 rounded-lg font-display text-sm ${mode === "manual" ? "bg-primary text-primary-foreground" : ""}`}>
          <Type className="inline h-4 w-4 mr-1" /> Manual
        </button>
      </div>

      {mode === "camera" ? (
        <div className="mt-6 relative rounded-3xl border-2 bg-black overflow-hidden w-full max-w-md aspect-square mx-auto qr-square">
          <div ref={elRef} className="absolute inset-0 w-full h-full" />
          {!scanning && <div className="absolute inset-0 grid place-items-center text-white/70 text-sm">Activando cámara...</div>}
          {/* square guide overlay */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="h-2/3 w-2/3 rounded-2xl border-4 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border-2 bg-card p-6">
          <label className="block text-sm font-medium mb-2">ID del ticket o payload del QR</label>
          <textarea
            rows={3} value={manualValue} onChange={(e) => setManualValue(e.target.value)}
            placeholder='Pega aquí, por ejemplo: {"ticketId":"..."}'
            className="input font-mono text-sm"
          />
          <button
            onClick={() => {
              const v = manualValue.trim();
              if (!v) return;
              try { const p = JSON.parse(v); if (p?.ticketId) return consume(p.ticketId); } catch {}
              consume(v);
            }}
            className="mt-3 w-full rounded-2xl bg-primary py-3 font-display text-lg text-primary-foreground sticker-lg"
          >
            Consumir
          </button>
        </div>
      )}

      {last && (
        <div role="status" aria-live="polite" className={`mt-6 rounded-3xl border-2 p-6 sticker-lg ${last.ok ? "bg-success/15 border-success" : "bg-destructive/15 border-destructive"}`}>
          {last.ok ? (
            <>
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-8 w-8" />
                <span className="font-display text-3xl">APROBADO</span>
              </div>
              <div className="mt-3 font-display text-4xl">{LABELS[last.data!.drinkType] ?? last.data!.drinkType}</div>
              <div className="text-sm text-muted-foreground mt-1">Créditos restantes: <b className="text-foreground">{last.data!.remainingCredits}</b></div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-8 w-8" />
                <span className="font-display text-3xl">RECHAZADO</span>
              </div>
              <div className="text-sm mt-2">{last.msg}</div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
