import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableIconLink } from "@/components/table-icon-link";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  getAdminKpis,
  getEmployeeOverview,
  listAuditLogs,
  listPendingInvoices,
} from "@/lib/data";
import {
  formatDateTimeForLocale,
  formatEurForLocale,
} from "@/lib/locale-format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: routeLocale } = await params;
  setRequestLocale(routeLocale);
  await requireAdmin();
  const t = await getTranslations("Admin");
  const tCommon = await getTranslations("Common");
  const locale = await getLocale();
  const [kpis, overview, pending, audits] = await Promise.all([
    getAdminKpis(),
    getEmployeeOverview(),
    listPendingInvoices(),
    listAuditLogs(8),
  ]);

  const cards = [
    { label: tCommon("employee"), value: String(kpis.activeEmployees) },
    { label: t("activeTools"), value: String(kpis.activeTools) },
    {
      label: t("kpiMonthly"),
      value: formatEurForLocale(kpis.monthlyCost, locale),
    },
    { label: t("pendingReviews"), value: String(kpis.pendingReviews) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          {t("dashboardTitle")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("companyWideSubtitle")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border/80 bg-card/70 px-4 py-5"
          >
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl tabular-nums">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">{t("pendingReviews")}</h2>
          <Link
            href="/admin/invoices"
            className="text-sm text-[var(--brand-deep)] hover:underline"
          >
            {t("viewAll")}
          </Link>
        </div>
        {pending.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-8 text-center text-muted-foreground">
            {t("noPending")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tCommon("employee")}</TableHead>
                  <TableHead>{tCommon("tool")}</TableHead>
                  <TableHead>{tCommon("amount")}</TableHead>
                  <TableHead>{t("monthly")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.slice(0, 5).map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.employee?.name}</TableCell>
                    <TableCell>{inv.tool?.name}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatEurForLocale(inv.amount, locale)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatEurForLocale(inv.monthly_cost, locale)}
                    </TableCell>
                    <TableCell className="text-right">
                      <TableIconLink
                        href={`/admin/invoices/${inv.id}`}
                        label={tCommon("review")}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">{t("employeeOverview")}</h2>
        <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon("employee")}</TableHead>
                <TableHead className="text-right">{t("activeTools")}</TableHead>
                <TableHead className="text-right">{t("monthlyCost")}</TableHead>
                <TableHead className="text-right">{tCommon("pending")}</TableHead>
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
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.activeTools}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEurForLocale(row.monthlyCost, locale)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.pending}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">{t("recentAudit")}</h2>
        {audits.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("financialEditsHint")}
          </p>
        ) : (
          <ul className="space-y-2 rounded-xl border border-border/80 bg-card/60 p-4 text-sm">
            {audits.map((log) => (
              <li
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0"
              >
                <span className="font-medium">{log.action}</span>
                <span className="text-muted-foreground">
                  {formatDateTimeForLocale(log.created_at, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
