import Link from "next/link";
import { MarkPaidButton } from "@/components/admin/mark-paid-button";
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
        <div className="flex flex-wrap gap-2">
          <MarkPaidButton months={span} unpaidTotal={report.unpaidTotal} />
          <Link
            href={`/api/report/csv?months=${span}`}
            className={cn(buttonVariants())}
          >
            Export CSV
          </Link>
        </div>
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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/80 bg-[color-mix(in_oklab,var(--brand)_8%,white)] p-5">
          <p className="text-sm text-muted-foreground">Company total</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl tabular-nums text-[var(--brand-deep)]">
            {formatEur(report.total)}
          </p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/60 p-5">
          <p className="text-sm text-muted-foreground">Unpaid (approved)</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl tabular-nums">
            {formatEur(report.unpaidTotal)}
          </p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/60 p-5">
          <p className="text-sm text-muted-foreground">Already paid</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl tabular-nums">
            {formatEur(report.paidTotal)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead className="text-right">Unpaid</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No monthly costs in this range.
                </TableCell>
              </TableRow>
            ) : (
              report.rows.map((row) => (
                <TableRow key={row.employee.id}>
                  <TableCell>{row.employee.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEur(row.approvedAmount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEur(row.paidAmount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEur(row.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <MarkPaidButton
                      months={span}
                      unpaidTotal={row.approvedAmount}
                      employeeId={row.employee.id}
                      employeeName={row.employee.name}
                      size="sm"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
            <TableRow>
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatEur(report.unpaidTotal)}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatEur(report.paidTotal)}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatEur(report.total)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Use <span className="font-medium">Mark paid</span> on a row for cash /
        one-off payouts. <span className="font-medium">Mark range as paid</span>{" "}
        still covers everyone unpaid in the selected months (e.g. bank batch).
      </p>
    </div>
  );
}
