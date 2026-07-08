import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { createDrinkTicket } from "@/services/api/ticket-service";
import { Sticker } from "@/components/Sticker";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { storeCurrentTicket } from "@/services/tickets/ticket-storage";
import { translateDrink, translateNow, type TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n-react";

const DRINK_GROUPS: Array<{
  title: TranslationKey;
  color: "yellow" | "pink" | "cyan" | "orange" | "lime" | "violet";
  drinks: string[];
}> = [
  {
    title: "drinkGroups.beer",
    color: "yellow",
    drinks: ["PILS_BEER", "RED_BEER", "BOA", "ALCOHOL_FREE_BEER"],
  },
  {
    title: "drinkGroups.spritz",
    color: "orange",
    drinks: ["SPRITZ_APEROL", "SPRITZ_CAMPARI", "SPRITZ_CYNAR"],
  },
  {
    title: "drinkGroups.wine",
    color: "pink",
    drinks: ["BASE_WINE", "PREMIUM_WINE"],
  },
  {
    title: "drinkGroups.soft",
    color: "cyan",
    drinks: ["SOFT_DRINK", "WATER"],
  },
  {
    title: "drinkGroups.cocktails",
    color: "violet",
    drinks: [
      "MOJITO",
      "GIN_TONIC",
      "GIN_LEMON",
      "VODKA_TONIC",
      "VODKA_LEMON",
      "NEGRONI",
      "AMERICANO",
    ],
  },
];

const markerColorClass: Record<(typeof DRINK_GROUPS)[number]["color"], string> = {
  yellow: "bg-neon-yellow text-foreground",
  pink: "bg-neon-pink text-foreground",
  cyan: "bg-neon-cyan text-background",
  orange: "bg-neon-orange text-foreground",
  lime: "bg-neon-lime text-foreground",
  violet: "bg-neon-violet text-foreground",
};

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
      <Accordion type="multiple" className="space-y-3">
        {DRINK_GROUPS.map((group) => (
          <AccordionItem
            key={group.title}
            value={group.title}
            className="overflow-visible rounded-3xl border-2 bg-card px-5 sticker-lg"
          >
            <AccordionTrigger className="overflow-visible py-5 hover:no-underline">
              <span className="flex items-center gap-3 overflow-visible py-1 pl-1">
                <Sticker color={group.color} rotate={-3} size="md" className="text-base sm:text-lg">
                  {t(group.title)}
                </Sticker>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-2">
                {group.drinks.map((drinkId) => (
                  <button
                    key={drinkId}
                    disabled={create.isPending}
                    onClick={() => create.mutate(drinkId)}
                    className="flex w-full items-center justify-between rounded-2xl border-2 bg-muted px-4 py-3 text-left disabled:opacity-60"
                  >
                    <span className="font-display text-xl leading-none sm:text-2xl">
                      {translateDrink(language, drinkId)}
                    </span>
                    <span
                      className={`ml-3 shrink-0 rounded-full px-3 py-1 font-display text-xs uppercase tracking-wider ${markerColorClass[group.color]}`}
                    >
                      {t("drinks.oneStar")}
                    </span>
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </main>
  );
}
