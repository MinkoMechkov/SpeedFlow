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
import { requireAdmin } from "@/lib/auth";
import { getReimbursementReport } from "@/lib/data";
import { formatEur, monthKey } from "@/lib/invoices/calculate";
import { cn } from "@/lib/utils";

export default async function AdminReportPage() {
  await requireAdmin();
  const month = monthKey(new Date());
  const report = await getReimbursementReport(month);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
            Monthly reimbursement report
          </h1>
          <p className="mt-1 text-muted-foreground">
            Finance export for {month.slice(0, 7)}.
          </p>
        </div>
        <Link
          href={`/api/report/csv?month=${month}`}
          className={cn(buttonVariants())}
        >
          Export CSV
        </Link>
      </div>

      <div className="rounded-xl border border-border/80 bg-[color-mix(in_oklab,var(--brand)_8%,white)] p-6">
        <p className="text-sm text-muted-foreground">Company total</p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-4xl tabular-nums text-[var(--brand-deep)]">
          {formatEur(report.total)}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead className="text-right">Monthly reimbursement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.rows.map((row) => (
              <TableRow key={row.employee.id}>
                <TableCell>{row.employee.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatEur(row.amount)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatEur(report.total)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
