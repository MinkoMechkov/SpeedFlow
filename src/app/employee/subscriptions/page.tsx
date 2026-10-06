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
import { getMySubscriptions } from "@/lib/data";
import { formatEur } from "@/lib/invoices/calculate";

export default async function SubscriptionsPage() {
  const session = await requireSession();
  const subscriptions = await getMySubscriptions(session);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          My subscriptions
        </h1>
        <p className="mt-1 text-muted-foreground">
          Tools billed to you and their calculated monthly reimbursement.
        </p>
      </div>

      {subscriptions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-muted-foreground">
          No subscriptions yet. Upload an invoice to get started.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Billing cycle</TableHead>
                <TableHead className="text-right">Monthly cost</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">
                    {sub.tool?.name ?? "—"}
                  </TableCell>
                  <TableCell>{sub.plan ?? "—"}</TableCell>
                  <TableCell className="capitalize">
                    {sub.billing_cycle.replace("_", " ")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEur(sub.monthly_cost)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={sub.status} />
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
