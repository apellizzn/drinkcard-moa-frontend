import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Beer, CreditCard, ReceiptText } from "lucide-react";
import { listCurrentVolunteerPayments } from "@/services/api/payment-service";
import { listCurrentVolunteerTickets, type Ticket } from "@/services/api/ticket-service";
import { AdminStatusBadge } from "@/components/admin/AdminDataTable";
import { useI18n } from "@/i18n/i18n";
import { dateLocales, drinkKey } from "@/i18n/format";

export const Route = createFileRoute("/_authenticated/app/history")({
  component: HistoryPage,
  head: () => ({ meta: [{ title: "Historial — DrinkCard MOA" }] }),
});

function HistoryPage() {
  const { language, t } = useI18n();
  const tickets = useQuery({
    queryKey: ["tickets", "me"],
    queryFn: () => listCurrentVolunteerTickets(25),
  });
  const payments = useQuery({
    queryKey: ["payments", "me"],
    queryFn: () => listCurrentVolunteerPayments(25),
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <Link
        to="/app"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("app.historyBack")}
      </Link>

      <div className="mt-5">
        <h1 className="font-display text-5xl">{t("app.historyTitle")}</h1>
        <p className="mt-1 text-muted-foreground">{t("app.historySubtitle")}</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border-2 bg-card p-5 sticker">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <Beer className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl">{t("app.historyDrinks")}</h2>
              <p className="text-sm text-muted-foreground">{t("app.historyTickets")}</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {tickets.isLoading && <Empty>{t("app.historyLoadingTickets")}</Empty>}
            {!tickets.isLoading && (tickets.data?.content.length ?? 0) === 0 && (
              <Empty>{t("app.historyNoTickets")}</Empty>
            )}
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
              <h2 className="font-display text-2xl">{t("app.historyPayments")}</h2>
              <p className="text-sm text-muted-foreground">{t("app.historyTopUps")}</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {payments.isLoading && <Empty>{t("app.historyLoadingPayments")}</Empty>}
            {!payments.isLoading && (payments.data?.content.length ?? 0) === 0 && (
              <Empty>{t("app.historyNoPayments")}</Empty>
            )}
            {payments.data?.content.map((payment) => (
              <div key={payment.paymentId} className="rounded-2xl border-2 bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      <ReceiptText className="h-4 w-4" /> {(payment.amount ?? 0).toFixed(2)} €
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {payment.createdAt
                        ? format(new Date(payment.createdAt), "d MMM yyyy, HH:mm", {
                            locale: dateLocales[language],
                          })
                        : t("common.noDate")}
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
  const { language, t } = useI18n();
  const created = ticket.createdAt
    ? format(new Date(ticket.createdAt), "d MMM yyyy, HH:mm", { locale: dateLocales[language] })
    : t("common.noDate");
  return (
    <div className="rounded-2xl border-2 bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{t(drinkKey(ticket.drinkType))}</div>
          <p className="mt-1 text-xs text-muted-foreground">{created}</p>
        </div>
        <AdminStatusBadge status={ticket.status} />
      </div>
    </div>
  );
}

function Empty({ children }: { children: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed p-5 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
