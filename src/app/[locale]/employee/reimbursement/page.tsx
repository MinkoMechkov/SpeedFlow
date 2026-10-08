import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSession } from "@/lib/auth";
import { getMyMonthlyCosts } from "@/lib/data";
import { monthKey } from "@/lib/invoices/calculate";
import {
  formatEurForLocale,
  formatMonthLabel,
} from "@/lib/locale-format";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function ReimbursementPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const activeLocale = await getLocale();
  const t = await getTranslations("Employee");
  const tCommon = await getTranslations("Common");

  const session = await requireSession();
  const month = monthKey(new Date());
  const monthLabel = formatMonthLabel(month.slice(0, 7), activeLocale);
  const costs = await getMyMonthlyCosts(session, month);
  const unpaidTotal = costs
    .filter((c) => c.status === "approved")
    .reduce((sum, c) => sum + c.amount, 0);
  const paidTotal = costs
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          {t("reimbursementTitle")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("reimbursementCalculatedFor", { month: monthLabel })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/80 bg-[color-mix(in_oklab,var(--brand)_8%,white)] p-6">
          <p className="text-sm text-muted-foreground">{t("unpaidThisMonth")}</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-4xl tabular-nums text-[var(--brand-deep)]">
            {formatEurForLocale(unpaidTotal, activeLocale)}
          </p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/60 p-6">
          <p className="text-sm text-muted-foreground">{t("paidThisMonth")}</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-4xl tabular-nums">
            {formatEurForLocale(paidTotal, activeLocale)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">{t("history")}</h2>
        <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("subscription")}</TableHead>
                <TableHead>{tCommon("month")}</TableHead>
                <TableHead>{tCommon("status")}</TableHead>
                <TableHead className="text-right">{tCommon("amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    {t("noReimbursementThisMonth")}
                  </TableCell>
                </TableRow>
              ) : (
                costs.map((row) => {
                  const rowMonthLabel = formatMonthLabel(
                    row.month.slice(0, 7),
                    activeLocale,
                  );
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        {row.subscription?.tool?.name ?? "—"}
                      </TableCell>
                      <TableCell>{rowMonthLabel}</TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatEurForLocale(row.amount, activeLocale)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
