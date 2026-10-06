import { PendingQueueWatcher } from "@/components/admin/pending-queue-watcher";
import { AppShell } from "@/components/layout/app-shell";
import { requireAdmin } from "@/lib/auth";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/invoices", label: "Reviews" },
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/tools", label: "Tools" },
  { href: "/admin/report", label: "Report" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  return (
    <AppShell session={session} nav={nav}>
      <PendingQueueWatcher />
      {children}
    </AppShell>
  );
}
