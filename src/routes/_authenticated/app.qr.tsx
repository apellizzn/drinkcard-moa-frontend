import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useQuery } from "@tanstack/react-query";
import { Sticker } from "@/components/Sticker";
import { ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import { getDrinkTicketStatus, type Ticket } from "@/services/api/ticket-service";
import { clearStoredTicket, getStoredTicket } from "@/services/tickets/ticket-storage";
import { createTicketQrPayload } from "@/services/qr/ticket-qr";

const LABELS: Record<string, string> = { BEER: "Cerveza", WINE: "Vino", WATER: "Agua", SOFT_DRINK: "Refresco" };

export const Route = createFileRoute("/_authenticated/app/qr")({
  component: QrPage,
  head: () => ({ meta: [{ title: "Tu QR — DrinkCard MOA" }] }),
});

function QrPage() {
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    setTicket(getStoredTicket());
  }, []);

  const status = useQuery({
    queryKey: ["ticket", ticket?.ticketId, "status"],
    queryFn: () => getDrinkTicketStatus(ticket!.ticketId),
    enabled: !!ticket?.ticketId,
    refetchInterval: 3000,
  });

  const current = status.data ?? ticket;
  const expiresAt = useMemo(() => (current?.expiresAt ? new Date(current.expiresAt).getTime() : Date.now() + 90_000), [current?.expiresAt]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(i);
  }, []);
  const remaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));

  if (!ticket) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="font-display text-4xl">Sin ticket activo</h1>
        <p className="text-muted-foreground mt-2">Elige una bebida para generar tu QR.</p>
        <button onClick={() => navigate({ to: "/app/drinks" })} className="mt-6 rounded-2xl bg-primary px-5 py-3 font-display text-primary-foreground sticker">
          Elegir bebida
        </button>
      </main>
    );
  }

  const isActive = (current?.status ?? "PENDING") === "PENDING" && remaining > 0;
  const isConsumed = current?.status === "CONSUMED";
  const isExpired = current?.status === "EXPIRED" || remaining <= 0;

  const qrValue = createTicketQrPayload(ticket.ticketId);

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <Link to="/app" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

      <div className="mt-4 text-center">
        <Sticker color="yellow" rotate={-6}>Ticket único</Sticker>
        <h1 className="mt-3 font-display text-4xl">{LABELS[ticket.drinkType] ?? ticket.drinkType}</h1>
      </div>

      <div className={`relative mt-6 rounded-3xl border-2 bg-white p-6 sticker-lg transition-opacity ${isActive ? "" : "opacity-40 grayscale"}`}>
        <Sticker color="pink" rotate={-8} className="absolute -top-3 -left-3">1 crédito</Sticker>
        <div className="grid place-items-center">
          <QRCodeSVG value={qrValue} size={256} bgColor="#ffffff" fgColor="#0a0613" level="Q" includeMargin />
        </div>
      </div>

      <div role="status" aria-live="polite" className="mt-5 grid gap-3 text-center">
        {isActive && (
          <div className="rounded-2xl border-2 border-foreground bg-foreground p-4 text-background shadow-sticker">
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-6 w-6" />
              <span className="font-display text-4xl leading-none">{remaining}s</span>
            </div>
            <p className="mt-2 text-xs font-medium opacity-80">Muéstralo en barra antes de que caduque</p>
          </div>
        )}
        {isConsumed && (
          <div className="rounded-2xl border-2 border-success bg-success/15 p-4">
            <div className="flex items-center justify-center gap-2 text-success">
              <CheckCircle2 className="h-6 w-6" /><span className="font-display text-2xl">¡Canjeado!</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Disfruta tu bebida 🍻</p>
          </div>
        )}
        {isExpired && !isConsumed && (
          <div className="rounded-2xl border-2 border-destructive bg-destructive/15 p-4">
            <div className="flex items-center justify-center gap-2 text-destructive">
              <XCircle className="h-6 w-6" /><span className="font-display text-2xl">Caducado</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Genera un nuevo QR</p>
          </div>
        )}
      </div>

      <div className="mt-3 text-center text-xs text-muted-foreground font-mono break-all">
        ID: {ticket.ticketId}
      </div>

      {(isExpired || isConsumed) && (
        <button
          onClick={() => {
            clearStoredTicket();
            navigate({ to: "/app/drinks" });
          }}
          className="mt-6 w-full rounded-2xl bg-primary py-3 font-display text-lg text-primary-foreground sticker-lg"
        >
          Pedir otra bebida
        </button>
      )}
    </main>
  );
}
