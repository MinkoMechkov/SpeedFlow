import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import {
  getAdminKpis,
  getEmployeeOverview,
  listAuditLogs,
  listPendingInvoices,
} from "@/lib/data";
import { formatEur } from "@/lib/invoices/calculate";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [kpis, overview, pending, audits] = await Promise.all([
    getAdminKpis(),
    getEmployeeOverview(),
    listPendingInvoices(),
    listAuditLogs(8),
  ]);

  const cards = [
    { label: "Employees", value: String(kpis.activeEmployees) },
    { label: "Active tools", value: String(kpis.activeTools) },
    { label: "Monthly cost", value: formatEur(kpis.monthlyCost) },
    { label: "Pending reviews", value: String(kpis.pendingReviews) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Admin dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Company-wide subscription spend and review queue.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border/80 bg-card/70 px-4 py-5"
          >
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl tabular-nums">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Pending reviews</h2>
          <Link href="/admin/invoices" className="text-sm text-[var(--brand-deep)] hover:underline">
            View all
          </Link>
        </div>
        {pending.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-8 text-center text-muted-foreground">
            No invoices waiting for review.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Tool</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.slice(0, 5).map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.employee?.name}</TableCell>
                    <TableCell>{inv.tool?.name}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatEur(inv.amount)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatEur(inv.monthly_cost)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/invoices/${inv.id}`}
                        className="text-sm text-[var(--brand-deep)] hover:underline"
                      >
                        Review
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Employee overview</h2>
        <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Active tools</TableHead>
                <TableHead className="text-right">Monthly cost</TableHead>
                <TableHead className="text-right">Pending</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.map((row) => (
                <TableRow key={row.employee.id}>
                  <TableCell>
                    <Link
                      href={`/admin/employees/${row.employee.id}`}
                      className="font-medium text-[var(--brand-deep)] hover:underline"
                    >
                      {row.employee.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.activeTools}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEur(row.monthlyCost)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.pending}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Recent audit log</h2>
        {audits.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Financial edits will appear here after admin actions.
          </p>
        ) : (
          <ul className="space-y-2 rounded-xl border border-border/80 bg-card/60 p-4 text-sm">
            {audits.map((log) => (
              <li
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0"
              >
                <span className="font-medium">{log.action}</span>
                <span className="text-muted-foreground">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
