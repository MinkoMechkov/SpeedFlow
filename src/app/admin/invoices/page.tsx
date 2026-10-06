import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { requireAdmin } from "@/lib/auth";
import { listPendingInvoices } from "@/lib/data";
import { formatEur } from "@/lib/invoices/calculate";

export default async function AdminInvoicesPage() {
  await requireAdmin();
  const invoices = await listPendingInvoices();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Invoice reviews
        </h1>
        <p className="mt-1 text-muted-foreground">
          Approve, edit, or reject AI-extracted invoices before they affect
          reimbursements.
        </p>
      </div>

      {invoices.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-10 text-center text-muted-foreground">
          Queue is clear.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Tool</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Monthly</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">
                    {inv.invoice_number}
                  </TableCell>
                  <TableCell>{inv.employee?.name}</TableCell>
                  <TableCell>{inv.tool?.name}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatEur(inv.amount)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatEur(inv.monthly_cost)}
                  </TableCell>
                  <TableCell>
                    {inv.ai_confidence != null
                      ? `${Math.round(inv.ai_confidence * 100)}%`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={inv.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/invoices/${inv.id}`}
                      className="text-sm text-[var(--brand)]"
                    >
                      Open
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
