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
import { requireSession } from "@/lib/auth";
import { getMyInvoices } from "@/lib/data";
import { formatEur } from "@/lib/invoices/calculate";
import { cn } from "@/lib/utils";

export default async function EmployeeInvoicesPage() {
  const session = await requireSession();
  const invoices = await getMyInvoices(session);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
            My invoices
          </h1>
          <p className="mt-1 text-muted-foreground">
            Uploads tied to your account only.
          </p>
        </div>
        <Link
          href="/employee/invoices/upload"
          className={cn(buttonVariants())}
        >
          Upload invoice
        </Link>
      </div>

      {invoices.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-muted-foreground">
          No invoices uploaded yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Tool</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Monthly</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">
                    {inv.invoice_number ?? inv.file_name}
                  </TableCell>
                  <TableCell>{inv.tool?.name ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatEur(inv.amount)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatEur(inv.monthly_cost)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={inv.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/employee/invoices/${inv.id}`}
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
