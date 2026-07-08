import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { createDrinkTicket } from "@/services/api/ticket-service";
import { Sticker } from "@/components/Sticker";
import { ArrowLeft, Beer, Wine, Droplet, GlassWater, Martini, CupSoda } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { storeCurrentTicket } from "@/services/tickets/ticket-storage";
import { translateDrink, translateNow } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n-react";

const DRINKS = [
  { id: "PILS_BEER", icon: Beer, color: "yellow" as const },
  { id: "RED_BEER", icon: Beer, color: "pink" as const },
  { id: "BOA", icon: Beer, color: "yellow" as const },
  { id: "ALCOHOL_FREE_BEER", icon: Beer, color: "cyan" as const },
  { id: "SPRITZ_APEROL", icon: Martini, color: "orange" as const },
  { id: "SPRITZ_CAMPARI", icon: Martini, color: "pink" as const },
  { id: "SPRITZ_CYNAR", icon: Martini, color: "yellow" as const },
  { id: "WINE", icon: Wine, color: "pink" as const },
  { id: "SOFT_DRINK", icon: CupSoda, color: "orange" as const },
  { id: "BASE_WINE", icon: Wine, color: "yellow" as const },
  { id: "PREMIUM_WINE", icon: Wine, color: "pink" as const },
  { id: "WATER", icon: Droplet, color: "cyan" as const },
  { id: "MOJITO", icon: GlassWater, color: "cyan" as const },
  { id: "GIN_TONIC", icon: GlassWater, color: "yellow" as const },
  { id: "GIN_LEMON", icon: GlassWater, color: "orange" as const },
  { id: "VODKA_TONIC", icon: GlassWater, color: "cyan" as const },
  { id: "VODKA_LEMON", icon: GlassWater, color: "orange" as const },
  { id: "NEGRONI", icon: Martini, color: "pink" as const },
  { id: "AMERICANO", icon: Martini, color: "orange" as const },
];

export const Route = createFileRoute("/_authenticated/app/drinks")({
  component: DrinksPage,
  head: () => ({ meta: [{ title: `${translateNow("drinks.title")} — DrinkCard MOA` }] }),
});

function DrinksPage() {
  const navigate = useNavigate();
  const session = useSession();
  const { language, t } = useLanguage();
  const create = useMutation({
    mutationFn: (drinkType: string) => {
      const volunteerId = session?.volunteerId ?? session?.userId;
      if (!volunteerId) throw new ApiError(400, t("errors.incompleteVolunteerSession"));
      return createDrinkTicket(volunteerId, drinkType);
    },
    onSuccess: (t) => {
      try {
        storeCurrentTicket(t);
      } catch {
        void 0;
      }
      navigate({ to: "/app/qr" });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : t("drinks.createError")),
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        to="/app"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("drinks.back")}
      </Link>
      <div className="mt-4 mb-6">
        <Sticker color="pink" rotate={-3}>
          {t("drinks.oneCredit")}
        </Sticker>
        <h1 className="mt-3 font-display text-5xl">{t("drinks.title")}</h1>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {DRINKS.map((d) => (
          <button
            key={d.id}
            disabled={create.isPending}
            onClick={() => create.mutate(d.id)}
            className="relative group rounded-3xl border-2 bg-card p-6 sm:p-8 sticker-lg hover:translate-y-[-2px] transition-transform disabled:opacity-60 text-left"
          >
            <Sticker color={d.color} rotate={-8} className="absolute -top-3 -right-3">
              {t("drinks.oneStar")}
            </Sticker>
            <d.icon className="h-14 w-14 text-primary" />
            <div className="mt-4 font-display text-3xl">{translateDrink(language, d.id)}</div>
          </button>
        ))}
      </div>
    </main>
  );
}
