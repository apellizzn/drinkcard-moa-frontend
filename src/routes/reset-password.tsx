import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo } from "react";
import { ApiError } from "@/lib/api";
import { confirmPasswordReset } from "@/services/api/auth-service";
import { AuthShell, Field } from "./login";
import { toast } from "sonner";
import { translateNow } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n-react";

type FormData = { newPassword: string; confirmPassword: string };

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>) => ({
    password_reset_token:
      typeof s.password_reset_token === "string" ? s.password_reset_token : undefined,
  }),
  component: ResetPasswordPage,
  head: () => ({ meta: [{ title: translateNow("auth.resetPasswordTitle") }] }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { password_reset_token } = useSearch({ from: "/reset-password" });
  const { t } = useLanguage();
  const schema = useMemo(
    () =>
      z
        .object({
          newPassword: z
            .string()
            .min(8, t("validation.passwordMin"))
            .max(20, t("validation.passwordMax")),
          confirmPassword: z.string().min(1, t("validation.passwordConfirm")),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          path: ["confirmPassword"],
          message: t("validation.passwordMismatch"),
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

  if (!password_reset_token) {
    return (
      <AuthShell
        title={t("auth.passwordResetTokenRequiredTitle")}
        subtitle={t("auth.passwordResetTokenRequiredSubtitle")}
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>{t("auth.passwordResetTokenRequiredBody")}</p>
          <Link
            to="/forgot-password"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-primary py-3 font-display text-lg tracking-wide text-primary-foreground sticker-lg"
          >
            {t("auth.requestNewPasswordReset")}
          </Link>
        </div>
      </AuthShell>
    );
  }

  const onSubmit = async (data: FormData) => {
    try {
      await confirmPasswordReset({
        token: password_reset_token,
        newPassword: data.newPassword,
      });
      toast.success(t("auth.resetPasswordSuccess"));
      navigate({ to: "/login", search: { redirect: undefined } });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t("auth.resetPasswordError"));
    }
  };

  return (
    <AuthShell title={t("auth.resetPasswordTitle")} subtitle={t("auth.resetPasswordSubtitle")}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label={t("auth.newPassword")} error={errors.newPassword?.message}>
          <input
            type="password"
            {...register("newPassword")}
            className="input"
            autoComplete="new-password"
          />
          <span className="mt-1 block text-xs text-muted-foreground">{t("auth.passwordHelp")}</span>
        </Field>
        <Field label={t("auth.confirmPassword")} error={errors.confirmPassword?.message}>
          <input
            type="password"
            {...register("confirmPassword")}
            className="input"
            autoComplete="new-password"
          />
        </Field>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-secondary py-3 font-display text-lg tracking-wide text-secondary-foreground sticker-lg disabled:opacity-60"
        >
          {isSubmitting ? t("auth.resetPasswordLoading") : t("auth.resetPassword")}
        </button>
      </form>
    </AuthShell>
  );
}
