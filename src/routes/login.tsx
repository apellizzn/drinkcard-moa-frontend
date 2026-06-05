import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import { loginUser } from "@/services/api/auth-service";
import { saveLoginSession } from "@/services/session/session-service";
import { defaultAuthenticatedPath, isAdmin } from "@/lib/session";
import { Sticker } from "@/components/Sticker";
import { BrandLogo } from "@/components/BrandLogo";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Email no válido"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(20, "Máximo 20 caracteres"),
});
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: LoginPage,
  head: () => ({ meta: [{ title: "Iniciar sesión — DrinkCard MOA" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await loginUser(data);
      saveLoginSession(res);
      toast.success("¡Bienvenido de vuelta!");
      navigate({ to: (isAdmin(res.role) ? "/admin" : redirect || defaultAuthenticatedPath(res.role)) as any });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al iniciar sesión";
      toast.error(msg);
    }
  };

  return (
    <AuthShell title="Inicia sesión" subtitle="Brinda otra vez">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email" error={errors.email?.message}>
          <input
            type="email" autoComplete="email" autoFocus
            {...register("email")}
            className="input"
            placeholder="tu@email.com"
          />
        </Field>
        <Field label="Contraseña" error={errors.password?.message}>
          <input
            type="password" autoComplete="current-password"
            {...register("password")}
            className="input"
            placeholder="••••••••"
          />
        </Field>
        <button
          type="submit" disabled={isSubmitting}
          className="w-full rounded-2xl bg-primary py-3 font-display text-lg tracking-wide text-primary-foreground sticker-lg disabled:opacity-60"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          ¿Sin cuenta? Pide a un administrador que te envíe una invitación por email.
        </p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <BrandLogo className="mb-6" />
        <div className="relative rounded-3xl bg-card border-2 p-8 sticker-lg">
          <Sticker color="yellow" rotate={-8} className="absolute -top-4 -right-3">{subtitle}</Sticker>
          <h1 className="font-display text-4xl">{title}</h1>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {error && <span role="alert" className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
