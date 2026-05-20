import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, ApiError } from "@/lib/api";
import { normalizeSession, sessionStore, type Session } from "@/lib/session";
import { AuthShell, Field } from "./login";
import { toast } from "sonner";

const schema = z.object({
  firstName: z.string().min(1, "Tu nombre"),
  lastName: z.string().min(1, "Tu apellido"),
  email: z.string().email("Email no válido"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(20, "Máximo 20 caracteres"),
});
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({ meta: [{ title: "Crear cuenta — DrinkCard MOA" }] }),
});

function RegisterPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await api("/api/v1/auth/register", { method: "POST", auth: false, body: JSON.stringify(data) });
      const res = await api<{
        token: string; volunteerId: string; email: string; role: Session["role"];
        firstName?: string; lastName?: string;
      }>("/api/v1/auth/login", {
        method: "POST", auth: false,
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      sessionStore.set(normalizeSession({ ...res, firstName: res.firstName ?? data.firstName, lastName: res.lastName ?? data.lastName }));
      toast.success("¡Cuenta creada! Bienvenido al festival.");
      navigate({ to: "/app" });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Error al crear la cuenta");
    }
  };

  return (
    <AuthShell title="Crea tu cuenta" subtitle="¡Bienvenido!">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre" error={errors.firstName?.message}>
            <input {...register("firstName")} className="input" autoComplete="given-name" />
          </Field>
          <Field label="Apellido" error={errors.lastName?.message}>
            <input {...register("lastName")} className="input" autoComplete="family-name" />
          </Field>
        </div>
        <Field label="Email" error={errors.email?.message}>
          <input type="email" {...register("email")} className="input" autoComplete="email" />
        </Field>
        <Field label="Contraseña" error={errors.password?.message}>
          <input type="password" {...register("password")} className="input" autoComplete="new-password" />
          <span className="mt-1 block text-xs text-muted-foreground">Entre 8 y 20 caracteres.</span>
        </Field>
        <button
          type="submit" disabled={isSubmitting}
          className="w-full rounded-2xl bg-secondary py-3 font-display text-lg tracking-wide text-secondary-foreground sticker-lg disabled:opacity-60"
        >
          {isSubmitting ? "Creando cuenta..." : "Crear mi cuenta"}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta? <Link to="/login" className="text-primary underline-offset-4 hover:underline">Inicia sesión</Link>
        </p>
      </form>
    </AuthShell>
  );
}
