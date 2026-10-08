import { getTranslations, setRequestLocale } from "next-intl/server";
import { InvoiceStatusWatcher } from "@/components/employee/invoice-status-watcher";
import { AppShell } from "@/components/layout/app-shell";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { requireSession } from "@/lib/auth";
import { getTourStatus } from "@/lib/data";
import { TOUR_VERSION } from "@/lib/onboarding";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function EmployeeLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Nav");
  const session = await requireSession();
  const tourStatus = await getTourStatus(session);
  const isEmployee = session.employee.role === "employee";
  const showTour =
    isEmployee && tourStatus.completedVersion !== TOUR_VERSION;

  const nav = [
    {
      href: "/employee/subscriptions",
      label: t("subscriptions"),
      tourId: "nav-subscriptions",
    },
    {
      href: "/employee/invoices",
      label: t("invoices"),
      tourId: "nav-invoices",
    },
    {
      href: "/employee/invoices/upload",
      label: t("upload"),
      tourId: "nav-upload",
    },
    {
      href: "/employee/reimbursement",
      label: t("reimbursement"),
      tourId: "nav-reimbursement",
    },
  ];

  const adminNav =
    session.employee.role === "admin"
      ? [...nav, { href: "/admin", label: t("admin") }]
      : nav;

  return (
    <OnboardingTour
      role="employee"
      show={showTour}
      version={TOUR_VERSION}
      employeeId={session.employee.id}
    >
      <AppShell session={session} nav={adminNav}>
        <InvoiceStatusWatcher />
        {children}
      </AppShell>
    </OnboardingTour>
  );
}
