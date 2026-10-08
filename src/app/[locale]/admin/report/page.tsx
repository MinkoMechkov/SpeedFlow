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
import { formatEurForLocale, formatMonthLabel } from "@/lib/locale-format";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

function parseMonths(value: string | string[] | undefined): 1 | 2 | 3 {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  if (n === 2 || n === 3) return n;
  return 1;
}

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ months?: string }>;
};

export default async function AdminReportPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const activeLocale = await getLocale();
  const t = await getTranslations("Admin");
  const tc = await getTranslations("Common");

  await requireAdmin();
  const query = await searchParams;
  const span = parseMonths(query.months);
  const report = await getReimbursementReport({ months: span });
  const rangeLabel = [...report.months]
    .reverse()
    .map((month) => formatMonthLabel(month, activeLocale))
    .join(" – ");

  const RANGE_OPTIONS = [
    { months: 1 as const, label: t("reportRange1") },
    { months: 2 as const, label: t("reportRange2") },
    { months: 3 as const, label: t("reportRange3") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
            {t("reportTitle")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {span === 1
              ? t("reportExportFor", { range: rangeLabel })
              : t("reportExportCovering", { range: rangeLabel })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MarkPaidButton months={span} unpaidTotal={report.unpaidTotal} />
          <a
            href={`/api/report/csv?months=${span}&locale=${activeLocale}`}
            className={cn(buttonVariants())}
          >
            {t("exportCsv")}
          </a>
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
          <p className="text-sm text-muted-foreground">{t("companyTotal")}</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl tabular-nums text-[var(--brand-deep)]">
            {formatEurForLocale(report.total, activeLocale)}
          </p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/60 p-5">
          <p className="text-sm text-muted-foreground">{t("unpaidApproved")}</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl tabular-nums">
            {formatEurForLocale(report.unpaidTotal, activeLocale)}
          </p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/60 p-5">
          <p className="text-sm text-muted-foreground">{t("alreadyPaid")}</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl tabular-nums">
            {formatEurForLocale(report.paidTotal, activeLocale)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tc("employee")}</TableHead>
              <TableHead className="text-right">{tc("unpaid")}</TableHead>
              <TableHead className="text-right">{tc("paid")}</TableHead>
              <TableHead className="text-right">{tc("total")}</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  {t("noMonthlyCostsInRange")}
                </TableCell>
              </TableRow>
            ) : (
              report.rows.map((row) => (
                <TableRow key={row.employee.id}>
                  <TableCell>{row.employee.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEurForLocale(row.approvedAmount, activeLocale)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEurForLocale(row.paidAmount, activeLocale)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEurForLocale(row.amount, activeLocale)}
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
              <TableCell className="font-semibold">{tc("total")}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatEurForLocale(report.unpaidTotal, activeLocale)}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatEurForLocale(report.paidTotal, activeLocale)}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatEurForLocale(report.total, activeLocale)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{t("cashVsBankHint")}</p>
    </div>
  );
}
