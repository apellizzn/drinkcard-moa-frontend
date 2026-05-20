import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { Sticker } from "@/components/Sticker";
import { useSession } from "@/hooks/use-session";
import { CreditCard, Beer, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DrinkCardAccount {
  volunteerId: string;
  credits: number;
  status: string;
  lastPurchaseTimestamp?: string | null;
}

export const Route = createFileRoute("/_authenticated/app")({
  component: AppPage,
  head: () => ({ meta: [{ title: "Mi tarjeta — DrinkCard MOA" }] }),
});

function AppPage() {
  const session = useSession();
  const qc = useQueryClient();

  const account = useQuery({
    queryKey: ["account", "me"],
    queryFn: () => api<DrinkCardAccount>("/api/v1/drink-card-accounts/me"),
  });

  const checkout = useMutation({
    mutationFn: () => {
      const volunteerId = session?.volunteerId ?? session?.userId;
      if (!volunteerId) throw new ApiError(400, "Sesión incompleta: falta el identificador del voluntario");
      return api<{ paymentId: string; checkoutUrl: string; status: string }>(
        "/api/v1/payments/checkout",
        {
          method: "POST",
          body: JSON.stringify({
            volunteerId,
            idempotencyKey: crypto.randomUUID(),
          }),
        },
      );
    },
    onSuccess: (res) => {
      try {
        localStorage.setItem("drinkcard.pendingPayment", JSON.stringify({ paymentId: res.paymentId, at: Date.now() }));
      } catch {}
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        toast.success("Pago creado");
        qc.invalidateQueries({ queryKey: ["account", "me"] });
      }
    },
    onError: (e: unknown) => toast.error(e instanceof ApiError ? e.message : "No se pudo crear el pago"),
  });

  const credits = account.data?.credits ?? 0;
  const status = account.data?.status ?? "—";
  const last = account.data?.lastPurchaseTimestamp;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <Sticker color="cyan" rotate={-4}>Mi tarjeta</Sticker>
        <h1 className="mt-3 font-display text-5xl">Hola, {session?.firstName ?? "voluntari@"} 👋</h1>
        <p className="text-muted-foreground mt-1">Tu tarjeta digital del festival.</p>
      </div>

      {/* Card */}
      <div className="relative overflow-hidden rounded-3xl border-2 bg-gradient-to-br from-primary via-neon-violet to-accent p-8 sticker-lg glow-pink">
        <div className="absolute -right-6 -top-6"><Sticker color="yellow" rotate={12} size="lg">DRINKCARD</Sticker></div>
        <div className="text-primary-foreground/80 font-display tracking-widest text-sm">CRÉDITOS</div>
        <div className="font-display text-8xl leading-none text-primary-foreground">
          {account.isLoading ? <Loader2 className="h-16 w-16 animate-spin" /> : credits}
        </div>
        <div className="mt-6 flex items-center justify-between text-primary-foreground">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-70">Estado</div>
            <div className="font-display text-lg">{status}</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-widest opacity-70">Última compra</div>
            <div className="font-display text-lg">
              {last ? format(new Date(last), "d MMM, HH:mm", { locale: es }) : "—"}
            </div>
          </div>
        </div>
      </div>

      {account.isError && (
        <p className="mt-3 text-sm text-destructive">
          {account.error instanceof ApiError ? account.error.message : "Error cargando tu tarjeta"}
        </p>
      )}

      {/* Actions */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => checkout.mutate()}
          disabled={checkout.isPending}
          className="group relative rounded-3xl border-2 bg-card p-6 text-left sticker-lg hover:bg-muted transition-colors disabled:opacity-60"
        >
          <Sticker color="yellow" rotate={-6} className="absolute -top-3 -left-3">10€</Sticker>
          <CreditCard className="h-10 w-10 text-secondary" />
          <h2 className="mt-3 font-display text-2xl">Comprar 5 bebidas</h2>
          <p className="text-sm text-muted-foreground mt-1">Pago seguro con SumUp</p>
          <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
            {checkout.isPending ? "Creando pago..." : "Comprar ahora"} <ExternalLink className="h-4 w-4" />
          </div>
        </button>

        <Link
          to="/app/drinks"
          className={`group relative rounded-3xl border-2 p-6 sticker-lg transition-colors ${
            credits > 0 ? "bg-primary text-primary-foreground hover:brightness-110" : "bg-muted text-muted-foreground pointer-events-none opacity-60"
          }`}
        >
          <Sticker color="cyan" rotate={6} className="absolute -top-3 -right-3">QR</Sticker>
          <Beer className="h-10 w-10" />
          <h2 className="mt-3 font-display text-2xl">Pedir una bebida</h2>
          <p className="text-sm opacity-80 mt-1">
            {credits > 0 ? "Genera tu QR de un solo uso" : "Sin créditos, compra primero"}
          </p>
        </Link>
      </div>
    </main>
  );
}
