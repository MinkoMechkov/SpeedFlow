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
import { formatEur } from "@/lib/invoices/calculate";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS = [
  { months: 1, label: "1 month" },
  { months: 2, label: "2 months" },
  { months: 3, label: "3 months" },
] as const;

function parseMonths(value: string | string[] | undefined): 1 | 2 | 3 {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  if (n === 2 || n === 3) return n;
  return 1;
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.slice(0, 7).split("-");
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, 1));
  return date.toLocaleString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function AdminReportPage({
  searchParams,
}: {
  searchParams: Promise<{ months?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const span = parseMonths(params.months);
  const report = await getReimbursementReport({ months: span });
  const rangeLabel = [...report.months]
    .reverse()
    .map(formatMonthLabel)
    .join(" – ");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
            Reimbursement report
          </h1>
          <p className="mt-1 text-muted-foreground">
            {span === 1 ? "Finance export for" : "Finance export covering"}{" "}
            {rangeLabel}.
          </p>
        </div>
        <Link
          href={`/api/report/csv?months=${span}`}
          className={cn(buttonVariants())}
        >
          Export CSV
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((opt) => {
          const active = opt.months === span;
          return (
            <Link
              key={opt.months}
              href={`/admin/report?months=${opt.months}`}
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

      <div className="rounded-xl border border-border/80 bg-[color-mix(in_oklab,var(--brand)_8%,white)] p-6">
        <p className="text-sm text-muted-foreground">
          Company total ({span === 1 ? "1 month" : `${span} months`})
        </p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-4xl tabular-nums text-[var(--brand-deep)]">
          {formatEur(report.total)}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead className="text-right">
                {span === 1 ? "Monthly reimbursement" : "Reimbursement total"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-muted-foreground">
                  No approved monthly costs in this range.
                </TableCell>
              </TableRow>
            ) : (
              report.rows.map((row) => (
                <TableRow key={row.employee.id}>
                  <TableCell>{row.employee.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEur(row.amount)}
                  </TableCell>
                </TableRow>
              ))
            )}
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
