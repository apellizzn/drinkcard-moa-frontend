import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Beer, CreditCard, ReceiptText } from "lucide-react";
import { listCurrentVolunteerPayments } from "@/services/api/payment-service";
import { listCurrentVolunteerTickets, type Ticket } from "@/services/api/ticket-service";
import { AdminStatusBadge } from "@/components/admin/AdminDataTable";

export const Route = createFileRoute("/_authenticated/app/history")({
  component: HistoryPage,
  head: () => ({ meta: [{ title: "Historial — DrinkCard MOA" }] }),
});

const DRINK_LABELS: Record<string, string> = {
  BEER: "Cerveza",
  WINE: "Vino",
  SOFT_DRINK: "Refresco",
  WATER: "Agua",
};

function HistoryPage() {
  const tickets = useQuery({ queryKey: ["tickets", "me"], queryFn: () => listCurrentVolunteerTickets(25) });
  const payments = useQuery({ queryKey: ["payments", "me"], queryFn: () => listCurrentVolunteerPayments(25) });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <Link to="/app" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver a mi tarjeta
      </Link>

      <div className="mt-5">
        <h1 className="font-display text-5xl">Historial</h1>
        <p className="mt-1 text-muted-foreground">Tus pagos y bebidas generadas desde el backend.</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border-2 bg-card p-5 sticker">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <Beer className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl">Bebidas</h2>
              <p className="text-sm text-muted-foreground">Tickets QR emitidos</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {tickets.isLoading && <Empty>Cargando tickets...</Empty>}
            {!tickets.isLoading && (tickets.data?.content.length ?? 0) === 0 && <Empty>No hay tickets todavía.</Empty>}
            {tickets.data?.content.map((ticket) => (
              <TicketRow key={ticket.drinkTicketId ?? ticket.ticketId} ticket={ticket} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border-2 bg-card p-5 sticker">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl">Pagos</h2>
              <p className="text-sm text-muted-foreground">Recargas de créditos</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {payments.isLoading && <Empty>Cargando pagos...</Empty>}
            {!payments.isLoading && (payments.data?.content.length ?? 0) === 0 && <Empty>No hay pagos todavía.</Empty>}
            {payments.data?.content.map((payment) => (
              <div key={payment.paymentId} className="rounded-2xl border-2 bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      <ReceiptText className="h-4 w-4" /> {(payment.amount ?? 0).toFixed(2)} €
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {payment.createdAt ? format(new Date(payment.createdAt), "d MMM yyyy, HH:mm", { locale: es }) : "Sin fecha"}
                    </p>
                  </div>
                  <AdminStatusBadge status={payment.status} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  const created = ticket.createdAt ? format(new Date(ticket.createdAt), "d MMM yyyy, HH:mm", { locale: es }) : "Sin fecha";
  return (
    <div className="rounded-2xl border-2 bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{DRINK_LABELS[ticket.drinkType] ?? ticket.drinkType}</div>
          <p className="mt-1 text-xs text-muted-foreground">{created}</p>
        </div>
        <AdminStatusBadge status={ticket.status} />
      </div>
    </div>
  );
}

function Empty({ children }: { children: string }) {
  return <div className="rounded-2xl border-2 border-dashed p-5 text-center text-sm text-muted-foreground">{children}</div>;
}
