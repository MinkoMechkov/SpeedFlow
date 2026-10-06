import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import { getEmployeeOverview } from "@/lib/data";
import { formatEur } from "@/lib/invoices/calculate";

export default async function AdminEmployeesPage() {
  await requireAdmin();
  const overview = await getEmployeeOverview();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Employees
        </h1>
        <p className="mt-1 text-muted-foreground">
          Open an employee to inspect subscriptions and invoices.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Active tools</TableHead>
              <TableHead className="text-right">Monthly cost</TableHead>
              <TableHead className="text-right">Pending</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overview.map((row) => (
              <TableRow key={row.employee.id}>
                <TableCell>
                  <Link
                    href={`/admin/employees/${row.employee.id}`}
                    className="font-medium text-[var(--brand)]"
                  >
                    {row.employee.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {row.employee.email}
                  </p>
                </TableCell>
                <TableCell>{row.employee.department ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.activeTools}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatEur(row.monthlyCost)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.pending}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
