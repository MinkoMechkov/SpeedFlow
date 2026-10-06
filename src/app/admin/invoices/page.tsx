import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
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
import {
  listInvoices,
  type AdminInvoiceStatusFilter,
} from "@/lib/data";
import { formatEur } from "@/lib/invoices/calculate";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_FILTERS: { value: AdminInvoiceStatusFilter; label: string }[] = [
  { value: "pending_review", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

function parseStatus(
  value: string | string[] | undefined,
): AdminInvoiceStatusFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  if (
    raw === "all" ||
    raw === "approved" ||
    raw === "rejected" ||
    raw === "pending_review"
  ) {
    return raw;
  }
  return "pending_review";
}

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const status = parseStatus(params.status);
  const invoices = await listInvoices({ status });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Invoice reviews
        </h1>
        <p className="mt-1 text-muted-foreground">
          Approve, edit, or reject AI-extracted invoices before they affect
          reimbursements. Open any row to see the original file.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((opt) => {
          const active = opt.value === status;
          return (
            <Link
              key={opt.value}
              href={`/admin/invoices?status=${opt.value}`}
              className={cn(
                buttonVariants({ variant: active ? "default" : "outline" }),
                "cursor-pointer",
              )}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      {invoices.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-10 text-center text-muted-foreground">
          {status === "pending_review"
            ? "Queue is clear."
            : "No invoices in this filter."}
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
