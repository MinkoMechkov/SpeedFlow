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
import { requireSession } from "@/lib/auth";
import { getMySubscriptions } from "@/lib/data";
import { formatEurForLocale } from "@/lib/locale-format";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function SubscriptionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const activeLocale = await getLocale();
  const t = await getTranslations("Employee");
  const tCommon = await getTranslations("Common");
  const tInvoice = await getTranslations("Invoice");
  const tBilling = await getTranslations("BillingCycle");

  const session = await requireSession();
  const subscriptions = await getMySubscriptions(session);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          {t("subscriptionsTitle")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("subscriptionsSubtitle")}</p>
      </div>

      {subscriptions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-muted-foreground">
          {t("noSubscriptions")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon("tool")}</TableHead>
                <TableHead>{tInvoice("plan")}</TableHead>
                <TableHead>{tInvoice("billingCycle")}</TableHead>
                <TableHead className="text-right">{t("monthlyCost")}</TableHead>
                <TableHead>{tCommon("status")}</TableHead>
                <TableHead>{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">
                    {sub.tool?.name ?? "—"}
                  </TableCell>
                  <TableCell>{sub.plan ?? "—"}</TableCell>
                  <TableCell>
                    {tBilling(sub.billing_cycle)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEurForLocale(sub.monthly_cost, activeLocale)}
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
      )}
    </div>
  );
}
