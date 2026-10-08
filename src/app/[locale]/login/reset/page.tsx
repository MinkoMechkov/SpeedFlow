import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { isDemoMode } from "@/lib/mode";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function ResetPasswordPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  if (isDemoMode()) {
    return (
      <AuthShell title={t("passwordReset")} subtitle={t("resetUnavailableDemo")}>
        <p className="text-sm text-muted-foreground">
          {t("useDemoPersona")}{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--brand-deep)] underline-offset-4 hover:underline"
          >
            {t("signInPage")}
          </Link>
          .
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("setNewPassword")}
      subtitle={t("setNewPasswordSubtitle")}
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
