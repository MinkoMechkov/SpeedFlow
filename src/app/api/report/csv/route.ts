import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getReimbursementReport } from "@/lib/data";
import { monthKey } from "@/lib/invoices/calculate";

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session || session.employee.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? monthKey(new Date());
  const report = await getReimbursementReport(month);

  const lines = [
    "Employee,Email,Department,Monthly Reimbursement (EUR)",
    ...report.rows.map(
      (r) =>
        `"${r.employee.name}","${r.employee.email}","${r.employee.department ?? ""}",${r.amount.toFixed(2)}`,
    ),
    `"Total",,,${report.total.toFixed(2)}`,
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="spendflow-reimbursement-${month}.csv"`,
    },
  });
}
