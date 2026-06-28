import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { requestPasswordReset } from "@/services/api/auth-service";
import { AuthShell, Field } from "./login";
import { toast } from "sonner";
import { translateNow } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n-react";

type FormData = { email: string };

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({ meta: [{ title: translateNow("auth.forgotPasswordTitle") }] }),
});

function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [sent, setSent] = useState(false);
  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("validation.email")),
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
      await requestPasswordReset(data);
      setSent(true);
      toast.success(t("auth.passwordResetSent"));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("auth.passwordResetRequestError"));
    }
  };

  return (
    <AuthShell title={t("auth.forgotPasswordTitle")} subtitle={t("auth.forgotPasswordSubtitle")}>
      {sent ? (
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>{t("auth.passwordResetSentBody")}</p>
          <Link
            to="/login"
            search={{ redirect: undefined }}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-primary py-3 font-display text-lg tracking-wide text-primary-foreground sticker-lg"
          >
            {t("auth.backToLogin")}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <p className="text-sm text-muted-foreground">{t("auth.forgotPasswordBody")}</p>
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
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-primary py-3 font-display text-lg tracking-wide text-primary-foreground sticker-lg disabled:opacity-60"
          >
            {isSubmitting ? t("auth.requestPasswordResetLoading") : t("auth.requestPasswordReset")}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            <Link
              to="/login"
              search={{ redirect: undefined }}
              className="text-primary underline-offset-4 hover:underline"
            >
              {t("auth.backToLogin")}
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
