import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Sticker } from "@/components/Sticker";
import { useSession } from "@/hooks/use-session";
import { UserMenu } from "@/components/UserMenu";
import { canUseBarScanner, defaultAuthenticatedPath, isAdmin, sessionStore } from "@/lib/session";
import { BrandLogo } from "@/components/BrandLogo";
import { ArrowRight, CreditCard, QrCode, Beer, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const session = sessionStore.get();
    if (session) throw redirect({ to: isAdmin(session.role) ? "/admin" : "/app" });
  },
  component: Index,
  head: () => ({
    meta: [
      { title: "DrinkCard MOA — Tu tarjeta digital del festival" },
      {
        name: "description",
        content:
          "Compra créditos, genera tu QR y canjea bebidas en barra. La tarjeta de consumiciones digital del festival MOA.",
      },
    ],
  }),
});

function Index() {
  const session = useSession();
  const { t } = useI18n();
  const steps = [
    {
      n: "01",
      title: t("landing.step1Title"),
      desc: t("landing.step1Desc"),
      icon: CreditCard,
      color: "pink" as const,
    },
    {
      n: "02",
      title: t("landing.step2Title"),
      desc: t("landing.step2Desc"),
      icon: QrCode,
      color: "yellow" as const,
    },
    {
      n: "03",
      title: t("landing.step3Title"),
      desc: t("landing.step3Desc"),
      icon: Beer,
      color: "cyan" as const,
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Top nav */}
      <header className="relative z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <BrandLogo />
          <nav className="flex items-center gap-3">
            <LanguageSwitcher />
            {session ? (
              <UserMenu />
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center rounded-xl px-4 py-2 font-display tracking-wide hover:bg-muted transition-colors"
              >
                {t("nav.login")}
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-4 pt-10 pb-20 sm:pt-16 sm:pb-28">
          {/* Floating stickers (hidden on small screens to keep mobile clean) */}
          <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
            <div className="absolute left-[6%] top-[18%]">
              <Sticker color="yellow" rotate={-12} size="lg" float>
                {t("landing.stickerFestival")}
              </Sticker>
            </div>
            <div className="absolute right-[8%] top-[12%]">
              <Sticker color="cyan" rotate={9} size="lg" float>
                {t("landing.stickerCheers")}
              </Sticker>
            </div>
            <div className="absolute left-[12%] bottom-[18%]">
              <Sticker color="lime" rotate={6} float>
                {t("landing.stickerPaperless")}
              </Sticker>
            </div>
            <div className="absolute right-[10%] bottom-[24%]">
              <Sticker color="orange" rotate={-8} size="lg" float>
                {t("landing.stickerFastQr")}
              </Sticker>
            </div>
          </div>

          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center gap-2">
              <Sticker color="pink" rotate={-3}>
                {t("landing.stickerNew")}
              </Sticker>
              <Sticker color="violet" rotate={3}>
                {t("landing.stickerSecurePayments")}
              </Sticker>
            </div>
            <h1 className="font-display text-6xl sm:text-8xl leading-[0.9] tracking-tight">
              {t("landing.titleStart")}{" "}
              <span className="text-primary">{t("landing.titleHighlight")}</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">{t("landing.subtitle")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {session ? (
                <>
                  <Link
                    to={isAdmin(session.role) ? "/admin" : "/app"}
                    className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-display text-lg tracking-wide text-primary-foreground sticker-lg glow-pink hover:translate-y-[-1px] transition-transform"
                  >
                    {isAdmin(session.role) ? t("landing.goAdmin") : t("landing.goCard")}{" "}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    to={canUseBarScanner(session.role) ? "/bar/scanner" : "/app/drinks"}
                    className="inline-flex items-center gap-2 rounded-2xl bg-card px-6 py-3 font-display text-lg tracking-wide border-2 hover:bg-muted transition-colors"
                  >
                    {canUseBarScanner(session.role) ? t("nav.barScanner") : t("landing.orderDrink")}
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
                  search={{ redirect: undefined }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-display text-lg tracking-wide text-primary-foreground sticker-lg glow-pink hover:translate-y-[-1px] transition-transform"
                >
                  {t("nav.login")} <ArrowRight className="h-5 w-5" />
                </Link>
              )}
            </div>
            {!session && (
              <p className="mt-4 text-sm text-muted-foreground">{t("landing.inviteOnly")}</p>
            )}
          </div>
        </section>

        {/* Steps */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-12 text-center">
            <Sticker color="cyan" rotate={-4}>
              {t("landing.how")}
            </Sticker>
            <h2 className="mt-4 font-display text-5xl sm:text-6xl">{t("landing.stepsTitle")}</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-3xl bg-card p-6 border-2 sticker-lg">
                <Sticker color={s.color} rotate={-6} className="absolute -top-4 -left-3">
                  {s.n}
                </Sticker>
                <s.icon className="mt-4 h-10 w-10 text-primary" />
                <h3 className="mt-4 font-display text-3xl">{s.title}</h3>
                <p className="mt-2 text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roles */}
        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-secondary/15 border-2 border-secondary p-6">
              <Beer className="h-8 w-8 text-secondary" />
              <h3 className="mt-3 font-display text-2xl">{t("landing.volunteersTitle")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t("landing.volunteersDesc")}</p>
            </div>
            <div className="rounded-3xl bg-accent/15 border-2 border-accent p-6">
              <QrCode className="h-8 w-8 text-accent" />
              <h3 className="mt-3 font-display text-2xl">{t("landing.barTitle")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t("landing.barDesc")}</p>
            </div>
            <div className="rounded-3xl bg-primary/15 border-2 border-primary p-6">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <h3 className="mt-3 font-display text-2xl">{t("landing.orgTitle")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t("landing.orgDesc")}</p>
            </div>
          </div>
        </section>

        <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} DrinkCard MOA — {t("landing.footer")}
        </footer>
      </main>
    </div>
  );
}
