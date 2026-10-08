import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSession } from "@/lib/auth";
import { getMyMonthlyCosts, getMySubscriptions } from "@/lib/data";
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
  const [costs, subscriptions] = await Promise.all([
    getMyMonthlyCosts(session, month),
    getMySubscriptions(session),
  ]);
  const total =
    costs.length > 0
      ? costs.reduce((sum, c) => sum + c.amount, 0)
      : subscriptions
          .filter((s) => s.status === "active")
          .reduce((sum, s) => sum + (s.monthly_cost ?? 0), 0);

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

      <div className="rounded-xl border border-border/80 bg-[color-mix(in_oklab,var(--brand)_8%,white)] p-6">
        <p className="text-sm text-muted-foreground">{t("totalThisMonth")}</p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-4xl tabular-nums text-[var(--brand-deep)]">
          {formatEurForLocale(total, activeLocale)}
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">{t("history")}</h2>
        <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("subscription")}</TableHead>
                <TableHead>{tCommon("month")}</TableHead>
                <TableHead className="text-right">{tCommon("amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(costs.length
                ? costs
                : subscriptions
                    .filter((s) => s.status === "active")
                    .map((s) => ({
                      id: s.id,
                      subscription_id: s.id,
                      month,
                      amount: s.monthly_cost ?? 0,
                      toolName: s.tool?.name,
                    }))
              ).map((row) => {
                const sub = subscriptions.find(
                  (s) => s.id === row.subscription_id,
                );
                const rowMonthLabel = formatMonthLabel(
                  row.month.slice(0, 7),
                  activeLocale,
                );
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      {"toolName" in row
                        ? (row.toolName as string)
                        : (sub?.tool?.name ?? "—")}
                    </TableCell>
                    <TableCell>{rowMonthLabel}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatEurForLocale(row.amount, activeLocale)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
