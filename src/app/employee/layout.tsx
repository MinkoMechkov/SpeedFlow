import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth";

const nav = [
  { href: "/employee/subscriptions", label: "Subscriptions" },
  { href: "/employee/invoices", label: "Invoices" },
  { href: "/employee/invoices/upload", label: "Upload" },
  { href: "/employee/reimbursement", label: "Reimbursement" },
];

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const adminNav =
    session.employee.role === "admin"
      ? [...nav, { href: "/admin", label: "Admin" }]
      : nav;

  return (
    <AppShell session={session} nav={adminNav}>
      {children}
    </AppShell>
  );
}
