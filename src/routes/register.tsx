import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import { loginUser, registerUser } from "@/services/api/auth-service";
import { saveLoginSession } from "@/services/session/session-service";
import { AuthShell, Field } from "./login";
import { toast } from "sonner";

const schema = z.object({
  firstName: z.string().min(1, "Tu nombre"),
  lastName: z.string().min(1, "Tu apellido"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(20, "Máximo 20 caracteres"),
});
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/register")({
  validateSearch: (s: Record<string, unknown>) => ({
    invitation_token: typeof s.invitation_token === "string" ? s.invitation_token : undefined,
  }),
  component: RegisterPage,
  head: () => ({ meta: [{ title: "Crear cuenta — DrinkCard MOA" }] }),
});

function RegisterPage() {
  const navigate = useNavigate();
  const { invitation_token } = useSearch({ from: "/register" });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (!invitation_token) {
    return (
      <AuthShell title="Invitación requerida" subtitle="No se puede crear la cuenta">
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            Para registrarte necesitas un enlace de invitación. Pide a un administrador que te envíe una
            invitación por email.
          </p>
          <p>
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" search={{ redirect: undefined }} className="text-primary underline-offset-4 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  const onSubmit = async (data: FormData) => {
    try {
      const registered = await registerUser({ ...data, invitationToken: invitation_token });
      const res = await loginUser({ email: registered.email, password: data.password });
      saveLoginSession(res, { firstName: data.firstName, lastName: data.lastName });
      toast.success("¡Cuenta creada! Bienvenido al festival.");
      navigate({ to: "/app" });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Error al crear la cuenta");
    }
  };

  return (
    <AuthShell title="Completa tu cuenta" subtitle="¡Bienvenido al equipo!">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre" error={errors.firstName?.message}>
            <input {...register("firstName")} className="input" autoComplete="given-name" />
          </Field>
          <Field label="Apellido" error={errors.lastName?.message}>
            <input {...register("lastName")} className="input" autoComplete="family-name" />
          </Field>
        </div>
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
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" search={{ redirect: undefined }} className="text-primary underline-offset-4 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
