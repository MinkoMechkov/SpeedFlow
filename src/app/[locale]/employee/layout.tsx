import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function EmployeeLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Nav");
  const session = await requireSession();

  const nav = [
    { href: "/employee/subscriptions", label: t("subscriptions") },
    { href: "/employee/invoices", label: t("invoices") },
    { href: "/employee/invoices/upload", label: t("upload") },
    { href: "/employee/reimbursement", label: t("reimbursement") },
  ];

  const adminNav =
    session.employee.role === "admin"
      ? [...nav, { href: "/admin", label: t("admin") }]
      : nav;

  return (
    <AppShell session={session} nav={adminNav}>
      {children}
    </AppShell>
  );
}
