import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Sticker } from "@/components/Sticker";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/payment/success")({
  component: PaymentSuccess,
  head: () => ({ meta: [{ title: "Pago confirmado — DrinkCard MOA" }] }),
});

type State = { kind: "loading" } | { kind: "ok"; credits?: number } | { kind: "pending"; status: string } | { kind: "none" } | { kind: "error"; msg: string };

function PaymentSuccess() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    (async () => {
      let pending: { paymentId: string } | null = null;
      try { const raw = localStorage.getItem("drinkcard.pendingPayment"); if (raw) pending = JSON.parse(raw); } catch {}
      if (!pending?.paymentId) return setState({ kind: "none" });
      try {
        const res = await api<{ status: string; credits?: number }>(
          `/api/v1/payments/${pending.paymentId}/confirm`, { method: "POST" }
        );
        localStorage.removeItem("drinkcard.pendingPayment");
        if (res.status === "SUCCESS") setState({ kind: "ok", credits: res.credits });
        else setState({ kind: "pending", status: res.status });
      } catch (e) {
        setState({ kind: "error", msg: e instanceof ApiError ? e.message : "Error confirmando el pago" });
      }
    })();
  }, []);

  return (
    <main className="mx-auto max-w-md px-4 py-12 text-center">
      <div className="rounded-3xl border-2 bg-card p-8 sticker-lg relative">
        <Sticker color="yellow" rotate={-8} className="absolute -top-3 -right-3">Pago</Sticker>
        {state.kind === "loading" && (<>
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
          <h1 className="mt-4 font-display text-3xl">Confirmando pago...</h1>
        </>)}
        {state.kind === "ok" && (<>
          <CheckCircle2 className="h-14 w-14 mx-auto text-success" />
          <h1 className="mt-3 font-display text-4xl">¡Listo!</h1>
          <p className="text-muted-foreground mt-1">Hemos añadido 5 créditos a tu tarjeta.</p>
          {state.credits != null && <div className="mt-3 font-display text-5xl text-primary">{state.credits}</div>}
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
