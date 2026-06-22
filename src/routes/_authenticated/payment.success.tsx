import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { getPaymentStatus, type PaymentStatusResponse } from "@/services/api/payment-service";
import { clearPendingPayment, getPendingPayment } from "@/services/payments/pending-payment-storage";
import { Sticker } from "@/components/Sticker";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/payment/success")({
  component: PaymentSuccess,
  head: () => ({ meta: [{ title: "Pago confirmado — DrinkCard MOA" }] }),
});

type State =
  | { kind: "loading"; attempt: number }
  | { kind: "ok"; amount?: number }
  | { kind: "pending"; status: string }
  | { kind: "none" }
  | { kind: "error"; msg: string };

const FINAL_PAYMENT_STATUSES = new Set(["SUCCESS", "FAILED", "EXPIRED"]);
const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_ATTEMPTS = 30;

function PaymentSuccess() {
  const [state, setState] = useState<State>({ kind: "loading", attempt: 1 });
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const pending = getPendingPayment();
      if (!pending?.paymentId) return setState({ kind: "none" });

      try {
        const res = await pollPaymentStatus(pending.paymentId, (attempt) => {
          if (!cancelled) setState({ kind: "loading", attempt });
        });
        if (cancelled) return;

        if (res.status === "SUCCESS") {
          clearPendingPayment();
          queryClient.invalidateQueries({ queryKey: ["account", "me"] });
          queryClient.invalidateQueries({ queryKey: ["payments", "me"] });
          setState({ kind: "ok", amount: res.amount });
          return;
        }

        if (FINAL_PAYMENT_STATUSES.has(res.status)) clearPendingPayment();
        setState({ kind: "pending", status: res.status });
      } catch (e) {
        if (cancelled) return;
        setState({ kind: "error", msg: e instanceof ApiError ? e.message : "Error verificando el pago" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  return (
    <main className="mx-auto max-w-md px-4 py-12 text-center">
      <div className="rounded-3xl border-2 bg-card p-8 sticker-lg relative">
        <Sticker color="yellow" rotate={-8} className="absolute -top-3 -right-3">Pago</Sticker>
        {state.kind === "loading" && (<>
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
          <h1 className="mt-4 font-display text-3xl">Verificando pago...</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Esperando confirmación de SumUp. Intento {state.attempt}/{MAX_POLL_ATTEMPTS}.
          </p>
        </>)}
        {state.kind === "ok" && (<>
          <CheckCircle2 className="h-14 w-14 mx-auto text-success" />
          <h1 className="mt-3 font-display text-4xl">¡Listo!</h1>
          <p className="text-muted-foreground mt-1">Hemos añadido 5 créditos a tu tarjeta.</p>
          {state.amount != null && <p className="mt-3 font-display text-2xl text-primary">{state.amount.toFixed(2)} €</p>}
        </>)}
        {state.kind === "pending" && (<>
          <AlertCircle className="h-14 w-14 mx-auto text-warning" />
          <h1 className="mt-3 font-display text-3xl">Pago {state.status}</h1>
          <p className="text-muted-foreground mt-1">Los créditos aún no se han añadido.</p>
        </>)}
        {state.kind === "none" && (<>
          <AlertCircle className="h-14 w-14 mx-auto text-warning" />
          <h1 className="mt-3 font-display text-3xl">Sin pago pendiente</h1>
          <p className="text-muted-foreground mt-1">No encontramos un pago en este navegador.</p>
        </>)}
        {state.kind === "error" && (<>
          <AlertCircle className="h-14 w-14 mx-auto text-destructive" />
          <h1 className="mt-3 font-display text-3xl">Algo falló</h1>
          <p className="text-muted-foreground mt-1">{state.msg}</p>
        </>)}
        <Link to="/app" className="mt-6 inline-block rounded-2xl bg-primary px-5 py-3 font-display text-primary-foreground sticker">
          Volver a mi tarjeta
        </Link>
      </div>
    </main>
  );
}

async function pollPaymentStatus(
  paymentId: string,
  onAttempt: (attempt: number) => void,
): Promise<PaymentStatusResponse> {
  let last: PaymentStatusResponse | null = null;

  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
    onAttempt(attempt);
    const res = await getPaymentStatus(paymentId);
    last = res;
    if (FINAL_PAYMENT_STATUSES.has(res.status)) return res;
    if (attempt < MAX_POLL_ATTEMPTS) await sleep(POLL_INTERVAL_MS);
  }

  return last ?? { paymentId, status: "PENDING" };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
