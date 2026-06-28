import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo } from "react";
import { ApiError } from "@/lib/api";
import { loginUser } from "@/services/api/auth-service";
import { saveLoginSession } from "@/services/session/session-service";
import { defaultAuthenticatedPath, isAdmin } from "@/lib/session";
import { Sticker } from "@/components/Sticker";
import { BrandLogo } from "@/components/BrandLogo";
import { toast } from "sonner";
import { LanguageMenu } from "@/components/LanguageMenu";
import { translateNow } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n-react";

type FormData = { email: string; password: string };

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: LoginPage,
  head: () => ({ meta: [{ title: translateNow("auth.loginTitle") }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const { t } = useLanguage();
  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("validation.email")),
        password: z
          .string()
          .min(8, t("validation.passwordMin"))
          .max(20, t("validation.passwordMax")),
      }),
    [t],
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await loginUser(data);
      saveLoginSession(res);
      toast.success(t("auth.welcomeBack"));
      navigate({
        to: (isAdmin(res.role) ? "/admin" : redirect || defaultAuthenticatedPath(res.role)) as
          | "/admin"
          | "/app",
      });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t("auth.loginError");
      toast.error(msg);
    }
  };

  return (
    <AuthShell title={t("auth.login")} subtitle={t("auth.backAgain")}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label={t("auth.email")} error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            autoFocus
            {...register("email")}
            className="input"
            placeholder={t("auth.emailPlaceholder")}
          />
        </Field>
        <Field label={t("auth.password")} error={errors.password?.message}>
          <input
            type="password"
            autoComplete="current-password"
            {...register("password")}
            className="input"
            placeholder="••••••••"
          />
        </Field>
        <div className="text-right text-sm">
          <Link to="/forgot-password" className="text-primary underline-offset-4 hover:underline">
            {t("auth.forgotPassword")}
          </Link>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-primary py-3 font-display text-lg tracking-wide text-primary-foreground sticker-lg disabled:opacity-60"
        >
          {isSubmitting ? t("auth.loginLoading") : t("auth.loginAction")}
        </button>
        <p className="text-center text-sm text-muted-foreground">{t("auth.noAccount")}</p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between gap-3">
          <BrandLogo />
          <LanguageMenu />
        </div>
        <div className="relative rounded-3xl bg-card border-2 p-8 sticker-lg">
          <Sticker color="yellow" rotate={-8} className="absolute -top-4 -right-3">
            {subtitle}
          </Sticker>
          <h1 className="font-display text-4xl">{title}</h1>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {error && (
        <span role="alert" className="mt-1 block text-xs text-destructive">
          {error}
        </span>
      )}
    </label>
  );
}
