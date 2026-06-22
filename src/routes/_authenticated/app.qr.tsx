import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useQuery } from "@tanstack/react-query";
import { Sticker } from "@/components/Sticker";
import { ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import { getDrinkTicketStatus, type Ticket } from "@/services/api/ticket-service";
import { clearStoredTicket, getStoredTicket } from "@/services/tickets/ticket-storage";
import { createTicketQrPayload } from "@/services/qr/ticket-qr";
import { translateDrink, translateNow } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n-react";

export const Route = createFileRoute("/_authenticated/app/qr")({
  component: QrPage,
  head: () => ({ meta: [{ title: `${translateNow("qr.uniqueTicket")} — DrinkCard MOA` }] }),
});

function QrPage() {
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const { language, t } = useLanguage();

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
  const expiresAt = useMemo(
    () => (current?.expiresAt ? new Date(current.expiresAt).getTime() : Date.now() + 90_000),
    [current?.expiresAt],
  );
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(i);
  }, []);
  const remaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));

  if (!ticket) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="font-display text-4xl">{t("qr.noActive")}</h1>
        <p className="text-muted-foreground mt-2">{t("qr.chooseDrinkHint")}</p>
        <button
          onClick={() => navigate({ to: "/app/drinks" })}
          className="mt-6 rounded-2xl bg-primary px-5 py-3 font-display text-primary-foreground sticker"
        >
          {t("qr.chooseDrink")}
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
      <Link
        to="/app"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </Link>

      <div className="mt-4 text-center">
        <Sticker color="yellow" rotate={-6}>
          {t("qr.uniqueTicket")}
        </Sticker>
        <h1 className="mt-3 font-display text-4xl">{translateDrink(language, ticket.drinkType)}</h1>
      </div>

      <div
        className={`relative mt-6 rounded-3xl border-2 bg-white p-6 sticker-lg transition-opacity ${isActive ? "" : "opacity-40 grayscale"}`}
      >
        <Sticker color="pink" rotate={-8} className="absolute -top-3 -left-3">
          {t("qr.oneCredit")}
        </Sticker>
        <div className="grid place-items-center">
          <QRCodeSVG
            value={qrValue}
            size={256}
            bgColor="#ffffff"
            fgColor="#0a0613"
            level="Q"
            includeMargin
          />
        </div>
      </div>

      <div role="status" aria-live="polite" className="mt-5 grid gap-3 text-center">
        {isActive && (
          <div className="rounded-2xl border-2 border-foreground bg-foreground p-4 text-background shadow-sticker">
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-6 w-6" />
              <span className="font-display text-4xl leading-none">{remaining}s</span>
            </div>
            <p className="mt-2 text-xs font-medium opacity-80">{t("qr.showBeforeExpiry")}</p>
          </div>
        )}
        {isConsumed && (
          <div className="rounded-2xl border-2 border-success bg-success/15 p-4">
            <div className="flex items-center justify-center gap-2 text-success">
              <CheckCircle2 className="h-6 w-6" />
              <span className="font-display text-2xl">{t("qr.consumed")}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("qr.enjoy")}</p>
          </div>
        )}
        {isExpired && !isConsumed && (
          <div className="rounded-2xl border-2 border-destructive bg-destructive/15 p-4">
            <div className="flex items-center justify-center gap-2 text-destructive">
              <XCircle className="h-6 w-6" />
              <span className="font-display text-2xl">{t("qr.expired")}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("qr.generateNew")}</p>
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
          {t("qr.orderAnother")}
        </button>
      )}
    </main>
  );
}
