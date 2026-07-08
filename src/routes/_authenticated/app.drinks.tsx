import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { createDrinkTicket } from "@/services/api/ticket-service";
import { Sticker } from "@/components/Sticker";
import { ArrowLeft, Beer, Wine, Droplet, GlassWater, Martini, CupSoda } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { storeCurrentTicket } from "@/services/tickets/ticket-storage";
import { translateDrink, translateNow, type TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n-react";

const DRINK_GROUPS: Array<{
  title: TranslationKey;
  color: "yellow" | "pink" | "cyan" | "orange";
  drinks: Array<{ id: string; icon: typeof Beer }>;
}> = [
  {
    title: "drinkGroups.beer",
    color: "yellow",
    drinks: [
      { id: "PILS_BEER", icon: Beer },
      { id: "RED_BEER", icon: Beer },
      { id: "BOA", icon: Beer },
      { id: "ALCOHOL_FREE_BEER", icon: Beer },
    ],
  },
  {
    title: "drinkGroups.spritz",
    color: "orange",
    drinks: [
      { id: "SPRITZ_APEROL", icon: Martini },
      { id: "SPRITZ_CAMPARI", icon: Martini },
      { id: "SPRITZ_CYNAR", icon: Martini },
    ],
  },
  {
    title: "drinkGroups.wine",
    color: "pink",
    drinks: [
      { id: "BASE_WINE", icon: Wine },
      { id: "PREMIUM_WINE", icon: Wine },
    ],
  },
  {
    title: "drinkGroups.soft",
    color: "cyan",
    drinks: [
      { id: "SOFT_DRINK", icon: CupSoda },
      { id: "WATER", icon: Droplet },
    ],
  },
  {
    title: "drinkGroups.cocktails",
    color: "orange",
    drinks: [
      { id: "MOJITO", icon: GlassWater },
      { id: "GIN_TONIC", icon: GlassWater },
      { id: "GIN_LEMON", icon: GlassWater },
      { id: "VODKA_TONIC", icon: GlassWater },
      { id: "VODKA_LEMON", icon: GlassWater },
      { id: "NEGRONI", icon: Martini },
      { id: "AMERICANO", icon: Martini },
    ],
  },
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
      <div className="space-y-7">
        {DRINK_GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="mb-3 font-display text-2xl tracking-wide text-muted-foreground">
              {t(group.title)}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {group.drinks.map((d) => (
                <button
                  key={d.id}
                  disabled={create.isPending}
                  onClick={() => create.mutate(d.id)}
                  className="relative group rounded-2xl border-2 bg-card p-4 sticker hover:translate-y-[-2px] transition-transform disabled:opacity-60 text-left"
                >
                  <Sticker color={group.color} rotate={-8} className="absolute -top-2 -right-2 text-xs">
                    {t("drinks.oneStar")}
                  </Sticker>
                  <d.icon className="h-8 w-8 text-primary" />
                  <div className="mt-3 font-display text-xl leading-none sm:text-2xl">
                    {translateDrink(language, d.id)}
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
