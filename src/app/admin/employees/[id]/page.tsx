import { notFound } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { requireAdmin } from "@/lib/auth";
import { getEmployeeDetail } from "@/lib/data";
import { formatEur } from "@/lib/invoices/calculate";

export default async function AdminEmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getEmployeeDetail(id);
  if (!detail) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          {detail.employee.name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {detail.employee.email}
          {detail.employee.department
            ? ` · ${detail.employee.department}`
            : ""}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Subscriptions</h2>
        <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Cycle</TableHead>
                <TableHead className="text-right">Monthly</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>{sub.tool?.name}</TableCell>
                  <TableCell>{sub.plan}</TableCell>
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
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Invoices</h2>
        <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Tool</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.invoice_number ?? inv.file_name}</TableCell>
                  <TableCell>{inv.tool?.name}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatEur(inv.amount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={inv.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
