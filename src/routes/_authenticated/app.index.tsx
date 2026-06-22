import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { Sticker } from "@/components/Sticker";
import { useSession } from "@/hooks/use-session";
import {
  AlertCircle,
  ArrowRight,
  Beer,
  CreditCard,
  ExternalLink,
  History,
  Loader2,
  RefreshCw,
  ScanLine,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { getCurrentDrinkCardAccount } from "@/services/api/drink-card-service";
import { createPaymentCheckout } from "@/services/api/payment-service";
import { storePendingPayment } from "@/services/payments/pending-payment-storage";
import { canUseBarScanner } from "@/lib/session";
import { Skeleton } from "@/components/ui/skeleton";
import { translateNow, translateStatus } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n-react";

export const Route = createFileRoute("/_authenticated/app/")({
  component: AppIndexPage,
  head: () => ({ meta: [{ title: `${translateNow("app.title")} — DrinkCard MOA` }] }),
});

function AppIndexPage() {
  const session = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { language, t, dateLocale } = useLanguage();

  const account = useQuery({
    queryKey: ["account", "me"],
    queryFn: getCurrentDrinkCardAccount,
  });

  const checkout = useMutation({
    mutationFn: () => {
      const volunteerId = session?.volunteerId ?? session?.userId;
      if (!volunteerId) throw new ApiError(400, t("errors.incompleteVolunteerSession"));
      return createPaymentCheckout(volunteerId);
    },
    onSuccess: (res) => {
      try {
        storePendingPayment(res.paymentId);
      } catch {
        void 0;
      }
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        toast.success(t("app.paymentCreated"));
        qc.invalidateQueries({ queryKey: ["account", "me"] });
      }
    },
    onError: (e: unknown) =>
      toast.error(e instanceof ApiError ? e.message : t("errors.createPayment")),
  });

  const credits = account.data?.credits ?? 0;
  const canRequestDrink = credits > 0;
  const status = account.data?.status ?? "—";
  const last = account.data?.lastPurchaseTimestamp;
  const primaryAction = account.isError ? "retry" : canRequestDrink ? "drink" : "checkout";
  const primaryDisabled = account.isLoading || checkout.isPending;
  const primaryLabel = account.isLoading
    ? t("app.loadingCard")
    : checkout.isPending
      ? t("app.primaryCreatePayment")
      : primaryAction === "retry"
        ? t("common.retry")
        : primaryAction === "drink"
          ? t("app.primaryRequestDrink")
          : t("app.primaryBuyCredits");

  const handlePrimaryAction = () => {
    if (primaryAction === "retry") {
      account.refetch();
      return;
    }
    if (primaryAction === "drink") {
      navigate({ to: "/app/drinks" });
      return;
    }
    checkout.mutate();
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <Sticker color="cyan" rotate={-4}>
          {t("app.title")}
        </Sticker>
        <h1 className="mt-3 font-display text-5xl">
          {t("app.greeting", { name: session?.firstName ?? t("app.defaultName") })}
        </h1>
        <p className="text-muted-foreground mt-1">{t("app.digitalCard")}</p>
      </div>

      <div className="relative overflow-hidden rounded-3xl border-2 bg-gradient-to-br from-primary via-neon-violet to-accent p-5 sticker-lg glow-pink sm:p-6">
        <div className="grid gap-4 text-primary-foreground sm:grid-cols-[auto_1fr] sm:items-end">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-75">{t("app.credits")}</div>
            <div className="font-display text-6xl leading-none sm:text-7xl">
              {account.isLoading ? (
                <Skeleton className="h-16 w-24 rounded-2xl bg-white/25" />
              ) : (
                credits
              )}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl bg-black/20 px-4 py-3 backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-widest opacity-70">
                {t("app.status")}
              </div>
              <div className="mt-1 font-display text-base">
                {account.isLoading ? t("common.loading") : translateStatus(language, status)}
              </div>
            </div>
            <div className="rounded-2xl bg-black/20 px-4 py-3 text-left backdrop-blur-sm sm:text-right">
              <div className="text-[10px] uppercase tracking-widest opacity-70">
                {t("app.lastPurchase")}
              </div>
              <div className="mt-1 font-display text-base">
                {last ? format(new Date(last), "d MMM, HH:mm", { locale: dateLocale }) : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {account.isError && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border-2 border-destructive bg-destructive/10 p-4 text-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">{t("app.cardLoadError")}</p>
            <p className="mt-1 text-muted-foreground">
              {account.error instanceof ApiError
                ? account.error.message
                : t("app.cardLoadFallback")}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={handlePrimaryAction}
          disabled={primaryDisabled}
          className={`group flex w-full items-center justify-between gap-4 rounded-3xl border-2 p-6 text-left sticker-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            primaryAction === "retry"
              ? "bg-card hover:bg-muted"
              : canRequestDrink
                ? "bg-primary text-primary-foreground hover:brightness-110"
                : "bg-secondary text-secondary-foreground hover:brightness-105"
          }`}
        >
          <div>
            <div className="flex items-center gap-3">
              {account.isLoading || checkout.isPending ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : primaryAction === "retry" ? (
                <RefreshCw className="h-7 w-7" />
              ) : canRequestDrink ? (
                <Beer className="h-8 w-8" />
              ) : (
                <CreditCard className="h-8 w-8" />
              )}
              <h2 className="font-display text-3xl">{primaryLabel}</h2>
            </div>
            <p
              className={`mt-2 text-sm ${primaryAction === "retry" ? "text-muted-foreground" : "opacity-85"}`}
            >
              {account.isLoading
                ? t("app.cardLoadingHint")
                : primaryAction === "retry"
                  ? t("app.retryHint")
                  : canRequestDrink
                    ? t("app.drinkHint")
                    : t("app.checkoutHint")}
            </p>
          </div>
          {!primaryDisabled && primaryAction === "drink" && (
            <ArrowRight className="h-5 w-5 shrink-0 opacity-80" />
          )}
          {!primaryDisabled && primaryAction === "checkout" && (
            <ExternalLink className="h-5 w-5 shrink-0 opacity-80" />
          )}
        </button>

        {canRequestDrink && (
          <button
            type="button"
            onClick={() => checkout.mutate()}
            disabled={checkout.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 bg-card px-5 py-3 font-display text-sm transition-colors hover:bg-muted disabled:opacity-60"
          >
            <CreditCard className="h-4 w-4" />
            {t("app.addMoreCredits")}
          </button>
        )}

        <Link
          to="/app/history"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 bg-card px-5 py-3 font-display text-sm transition-colors hover:bg-muted"
        >
          <History className="h-4 w-4" />
          {t("app.viewHistory")}
        </Link>

        {canUseBarScanner(session?.role) && (
          <Link
            to="/bar/scanner"
            className="group flex items-center justify-center gap-2 rounded-2xl border-2 bg-accent/10 px-5 py-3 font-display text-sm text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ScanLine className="h-4 w-4" />
            {t("app.openBarScanner")}
          </Link>
        )}
      </div>
    </main>
  );
}
