import { getTranslations, setRequestLocale } from "next-intl/server";
import { PendingQueueWatcher } from "@/components/admin/pending-queue-watcher";
import { AppShell } from "@/components/layout/app-shell";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { requireAdmin } from "@/lib/auth";
import { getTourStatus } from "@/lib/data";
import { TOUR_VERSION } from "@/lib/onboarding";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Nav");
  const session = await requireAdmin();
  const tourStatus = await getTourStatus(session);
  const showTour = tourStatus.completedVersion !== TOUR_VERSION;

  const nav = [
    { href: "/admin", label: t("dashboard"), tourId: "nav-dashboard" },
    { href: "/admin/invoices", label: t("reviews"), tourId: "nav-reviews" },
    {
      href: "/admin/employees",
      label: t("employees"),
      tourId: "nav-employees",
    },
    { href: "/admin/tools", label: t("tools"), tourId: "nav-tools" },
    { href: "/admin/report", label: t("report"), tourId: "nav-report" },
  ];

  return (
    <OnboardingTour
      role="admin"
      show={showTour}
      version={TOUR_VERSION}
      employeeId={session.employee.id}
    >
      <AppShell session={session} nav={nav}>
        <PendingQueueWatcher />
        {children}
      </AppShell>
    </OnboardingTour>
  );
}