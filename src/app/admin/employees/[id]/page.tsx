import Link from "next/link";
import { notFound } from "next/navigation";
import { EmployeeManageForm } from "@/components/admin/employee-manage-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { SubscriptionStatusActions } from "@/components/subscription-status-actions";
import { requireAdmin } from "@/lib/auth";
import { getEmployeeDetail } from "@/lib/data";
import { formatEur } from "@/lib/invoices/calculate";

export default async function AdminEmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getEmployeeDetail(id);
  if (!detail) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          {detail.employee.name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {detail.employee.email}
          {detail.employee.department
            ? ` · ${detail.employee.department}`
            : ""}
          {" · "}
          <span className="capitalize">{detail.employee.role}</span>
          {detail.employee.active ? "" : " · inactive"}
        </p>
      </div>

      <EmployeeManageForm employee={detail.employee} />

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Subscriptions</h2>
        <p className="text-sm text-muted-foreground">
          Pause or cancel does not rewrite historical monthly costs — only
          ongoing reimbursement projection going forward.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Cycle</TableHead>
                <TableHead className="text-right">Monthly</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>{sub.tool?.name}</TableCell>
                  <TableCell>{sub.plan}</TableCell>
                  <TableCell className="capitalize">
                    {sub.billing_cycle.replace("_", " ")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEur(sub.monthly_cost)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={sub.status} />
                  </TableCell>
                  <TableCell>
                    <SubscriptionStatusActions
                      subscriptionId={sub.id}
                      status={sub.status}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Invoices</h2>
        <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Tool</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No invoices for this employee.
                  </TableCell>
                </TableRow>
              ) : (
                detail.invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <Link
                        href={`/admin/invoices/${inv.id}`}
                        className="font-medium text-[var(--brand-deep)] hover:underline"
                      >
                        {inv.invoice_number ?? inv.file_name ?? "Invoice"}
                      </Link>
                    </TableCell>
                    <TableCell>{inv.tool?.name}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatEur(inv.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/invoices/${inv.id}`}
                        className="text-sm text-[var(--brand-deep)] hover:underline"
                      >
                        Open
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
