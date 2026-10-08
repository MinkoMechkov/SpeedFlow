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
import { formatEurForLocale } from "@/lib/locale-format";
import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminEmployeesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const activeLocale = await getLocale();
  const t = await getTranslations("Admin");
  const tc = await getTranslations("Common");
  const tRole = await getTranslations("Role");

  await requireAdmin();
  const overview = await getEmployeeOverview();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          {t("employeesTitle")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("employeesPageSubtitle")}</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tc("employee")}</TableHead>
              <TableHead>{tc("role")}</TableHead>
              <TableHead>{tc("department")}</TableHead>
              <TableHead>{tc("status")}</TableHead>
              <TableHead className="text-right">{t("activeTools")}</TableHead>
              <TableHead className="text-right">{t("monthlyCost")}</TableHead>
              <TableHead className="text-right">{t("pending")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overview.map((row) => (
              <TableRow key={row.employee.id}>
                <TableCell>
                  <Link
                    href={`/admin/employees/${row.employee.id}`}
                    className="font-medium text-[var(--brand-deep)] hover:underline"
                  >
                    {row.employee.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {row.employee.email}
                  </p>
                </TableCell>
                <TableCell>{tRole(row.employee.role)}</TableCell>
                <TableCell>{row.employee.department ?? "—"}</TableCell>
                <TableCell>
                  {row.employee.active ? tc("active") : tc("inactive")}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.activeTools}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatEurForLocale(row.monthlyCost, activeLocale)}
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
