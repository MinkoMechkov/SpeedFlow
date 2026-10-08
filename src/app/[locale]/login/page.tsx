import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/auth-shell";
import { LoginPanel } from "@/components/login-panel";
import { getDemoStore } from "@/lib/demo/store";
import { isDemoMode } from "@/lib/mode";

type Props = { params: Promise<{ locale: string }> };

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");
  const demoMode = isDemoMode();
  const demoUsers = demoMode ? getDemoStore().employees : [];

  return (
    <AuthShell title={t("welcomeBack")} subtitle={t("signInSubtitle")}>
      <LoginPanel demoMode={demoMode} demoUsers={demoUsers} />
    </AuthShell>
  );
}
