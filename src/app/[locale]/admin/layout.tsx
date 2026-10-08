import { getTranslations, setRequestLocale } from "next-intl/server";
import { PendingQueueWatcher } from "@/components/admin/pending-queue-watcher";
import { AppShell } from "@/components/layout/app-shell";
import { requireAdmin } from "@/lib/auth";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Nav");
  const session = await requireAdmin();

  const nav = [
    { href: "/admin", label: t("dashboard") },
    { href: "/admin/invoices", label: t("reviews") },
    { href: "/admin/employees", label: t("employees") },
    { href: "/admin/tools", label: t("tools") },
    { href: "/admin/report", label: t("report") },
  ];

  return (
    <AppShell session={session} nav={nav}>
      <PendingQueueWatcher />
      {children}
    </AppShell>
  );
}
