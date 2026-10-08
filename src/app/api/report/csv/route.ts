import { getTranslations } from "next-intl/server";
import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { getSessionUser } from "@/lib/auth";
import { getReimbursementReport } from "@/lib/data";

function parseMonths(value: string | null): 1 | 2 | 3 {
  const n = Number(value);
  if (n === 2 || n === 3) return n;
  return 1;
}

function parseLocale(value: string | null): string {
  if (value && routing.locales.includes(value as "bg" | "en")) return value;
  return routing.defaultLocale;
}

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session || session.employee.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const span = parseMonths(searchParams.get("months"));
  const locale = parseLocale(searchParams.get("locale"));
  const t = await getTranslations({ locale, namespace: "Report" });
  const tCommon = await getTranslations({ locale, namespace: "Common" });
  const report = await getReimbursementReport({ months: span });
  const range = [...report.months]
    .reverse()
    .map((m) => m.slice(0, 7))
    .join("_to_");

  const header = [
    t("csvEmployee"),
    t("csvEmail"),
    t("csvDepartment"),
    t("csvUnpaid"),
    t("csvPaid"),
    t("csvTotal"),
  ].join(",");

  const lines = [
    header,
    ...report.rows.map(
      (r) =>
        `"${r.employee.name}","${r.employee.email}","${r.employee.department ?? ""}",${r.approvedAmount.toFixed(2)},${r.paidAmount.toFixed(2)},${r.amount.toFixed(2)}`,
    ),
    `"${tCommon("total")}",,,${report.unpaidTotal.toFixed(2)},${report.paidTotal.toFixed(2)},${report.total.toFixed(2)}`,
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="spendflow-reimbursement-${span}m-${range}.csv"`,
    },
  });
}
