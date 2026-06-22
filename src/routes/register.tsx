import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import { loginUser, registerUser } from "@/services/api/auth-service";
import { saveLoginSession } from "@/services/session/session-service";
import { AuthShell, Field } from "./login";
import { toast } from "sonner";
import { useI18n } from "@/i18n/i18n";

interface FormData {
  firstName: string;
  lastName: string;
  password: string;
}

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
  const { t } = useI18n();
  const schema = z.object({
    firstName: z.string().min(1, t("errors.firstNameRequired")),
    lastName: z.string().min(1, t("errors.lastNameRequired")),
    password: z.string().min(8, t("errors.passwordMin")).max(20, t("errors.passwordMax")),
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (!invitation_token) {
    return (
      <AuthShell
        title={t("auth.registerMissingTitle")}
        subtitle={t("auth.registerMissingSubtitle")}
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>{t("auth.registerMissingBody")}</p>
          <p>
            {t("auth.alreadyAccount")}{" "}
            <Link
              to="/login"
              search={{ redirect: undefined }}
              className="text-primary underline-offset-4 hover:underline"
            >
              {t("nav.login")}
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
      toast.success(t("toast.accountCreated"));
      navigate({ to: "/app" });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("errors.register"));
    }
  };

  return (
    <AuthShell title={t("auth.registerTitle")} subtitle={t("auth.registerSubtitle")}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("common.name")} error={errors.firstName?.message}>
            <input {...register("firstName")} className="input" autoComplete="given-name" />
          </Field>
          <Field label={t("common.lastName")} error={errors.lastName?.message}>
            <input {...register("lastName")} className="input" autoComplete="family-name" />
          </Field>
        </div>
        <Field label={t("common.password")} error={errors.password?.message}>
          <input
            type="password"
            {...register("password")}
            className="input"
            autoComplete="new-password"
          />
          <span className="mt-1 block text-xs text-muted-foreground">{t("auth.passwordHint")}</span>
        </Field>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-secondary py-3 font-display text-lg tracking-wide text-secondary-foreground sticker-lg disabled:opacity-60"
        >
          {isSubmitting ? t("auth.registerSubmitting") : t("auth.registerSubmit")}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          {t("auth.alreadyAccount")}{" "}
          <Link
            to="/login"
            search={{ redirect: undefined }}
            className="text-primary underline-offset-4 hover:underline"
          >
            {t("nav.login")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
