import { createFileRoute, Link } from "@tanstack/react-router";
import { Sticker } from "@/components/Sticker";
import { useSession } from "@/hooks/use-session";
import { UserMenu } from "@/components/UserMenu";
import { ArrowRight, CreditCard, QrCode, Beer, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Top nav */}
      <header className="relative z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary font-display text-2xl text-primary-foreground sticker">
              D
            </span>
            <span className="font-display text-2xl tracking-wide">
              DrinkCard <span className="text-primary">MOA</span>
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            {session ? (
              <UserMenu />
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center rounded-xl px-4 py-2 font-display tracking-wide hover:bg-muted transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center rounded-xl bg-secondary px-4 py-2 font-display tracking-wide text-secondary-foreground sticker"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-4 pt-10 pb-20 sm:pt-16 sm:pb-28">
          {/* Floating stickers (hidden on small screens to keep mobile clean) */}
          <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
            <div className="absolute left-[6%] top-[18%]"><Sticker color="yellow" rotate={-12} size="lg" float>★ FESTIVAL 2026</Sticker></div>
            <div className="absolute right-[8%] top-[12%]"><Sticker color="cyan" rotate={9} size="lg" float>🍻 Cheers</Sticker></div>
            <div className="absolute left-[12%] bottom-[18%]"><Sticker color="lime" rotate={6} float>Cero papel</Sticker></div>
            <div className="absolute right-[10%] bottom-[24%]"><Sticker color="orange" rotate={-8} size="lg" float>QR en 1 toque</Sticker></div>
          </div>

          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center gap-2">
              <Sticker color="pink" rotate={-3}>Nuevo</Sticker>
              <Sticker color="violet" rotate={3}>Pagos seguros</Sticker>
            </div>
            <h1 className="font-display text-6xl sm:text-8xl leading-[0.9] tracking-tight">
              Tu tarjeta de bebidas,{" "}
              <span className="text-primary">sin colas, sin papel.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              Compra créditos, elige tu bebida y muestra el QR en barra. Tan rápido como pedir un trago.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to={session ? "/app" : "/register"}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-display text-lg tracking-wide text-primary-foreground sticker-lg glow-pink hover:translate-y-[-1px] transition-transform"
              >
                {session ? "Ir a mi tarjeta" : "Conseguir mi tarjeta"} <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to={session ? "/bar/scanner" : "/login"}
                className="inline-flex items-center gap-2 rounded-2xl bg-card px-6 py-3 font-display text-lg tracking-wide border-2 hover:bg-muted transition-colors"
              >
                {session ? "Escáner de barra" : "Ya tengo cuenta"}
              </Link>
            </div>
          </div>
        </section>

        {/* Ticker */}
        <div className="border-y-2 bg-primary/95 text-primary-foreground overflow-hidden">
          <div className="flex whitespace-nowrap py-3 animate-ticker font-display text-2xl tracking-widest">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex shrink-0 items-center gap-8 pr-8">
                <span>★ DRINKCARD MOA</span><span>•</span>
                <span>5 BEBIDAS POR 10€</span><span>•</span>
                <span>QR DE UN SOLO USO</span><span>•</span>
                <span>SIN COLAS EN CAJA</span><span>•</span>
                <span>FESTIVAL 2026</span><span>•</span>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-12 text-center">
            <Sticker color="cyan" rotate={-4}>Cómo funciona</Sticker>
            <h2 className="mt-4 font-display text-5xl sm:text-6xl">3 pasos y a brindar</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { n: "01", title: "Compra créditos", desc: "10€ = 5 bebidas. Pago seguro con SumUp, sin sacar la cartera.", icon: CreditCard, color: "pink" as const },
              { n: "02", title: "Genera tu QR", desc: "Elige la bebida y la app crea un ticket único válido 90 segundos.", icon: QrCode, color: "yellow" as const },
              { n: "03", title: "Brinda en barra", desc: "Enseña el QR, lo escanean y listo. Tu saldo se actualiza al instante.", icon: Beer, color: "cyan" as const },
            ].map((s) => (
              <div key={s.n} className="relative rounded-3xl bg-card p-6 border-2 sticker-lg">
                <Sticker color={s.color} rotate={-6} className="absolute -top-4 -left-3">{s.n}</Sticker>
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
              <h3 className="mt-3 font-display text-2xl">Para voluntarios</h3>
              <p className="text-sm text-muted-foreground mt-1">Tu saldo, tus QR, tu historial. Todo en el móvil.</p>
            </div>
            <div className="rounded-3xl bg-accent/15 border-2 border-accent p-6">
              <QrCode className="h-8 w-8 text-accent" />
              <h3 className="mt-3 font-display text-2xl">Para barra</h3>
              <p className="text-sm text-muted-foreground mt-1">Escáner instantáneo. Aprueba o rechaza en 1 segundo.</p>
            </div>
            <div className="rounded-3xl bg-primary/15 border-2 border-primary p-6">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <h3 className="mt-3 font-display text-2xl">Para organización</h3>
              <p className="text-sm text-muted-foreground mt-1">Dashboard con voluntarios, pagos y métricas en vivo.</p>
            </div>
          </div>
        </section>

        <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} DrinkCard MOA — Hecho con neón y café.
        </footer>
      </main>
    </div>
  );
}
