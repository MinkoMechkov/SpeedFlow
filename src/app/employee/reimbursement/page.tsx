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
import { formatEur, monthKey } from "@/lib/invoices/calculate";

export default async function ReimbursementPage() {
  const session = await requireSession();
  const month = monthKey(new Date());
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
          Monthly reimbursement
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your calculated amount for {month.slice(0, 7)}.
        </p>
      </div>

      <div className="rounded-xl border border-border/80 bg-[color-mix(in_oklab,var(--brand)_8%,white)] p-6">
        <p className="text-sm text-muted-foreground">Total this month</p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-4xl tabular-nums text-[var(--brand-deep)]">
          {formatEur(total)}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subscription</TableHead>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Amount</TableHead>
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
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    {"toolName" in row
                      ? (row.toolName as string)
                      : (sub?.tool?.name ?? "—")}
                  </TableCell>
                  <TableCell>{row.month.slice(0, 7)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEur(row.amount)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
