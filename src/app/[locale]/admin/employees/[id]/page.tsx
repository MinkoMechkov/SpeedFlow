import { notFound } from "next/navigation";
import { EmployeeManageForm } from "@/components/admin/employee-manage-form";
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
import { TableIconLink } from "@/components/table-icon-link";
import { requireAdmin } from "@/lib/auth";
import { getEmployeeDetail } from "@/lib/data";
import { formatEurForLocale } from "@/lib/locale-format";
import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

export default async function AdminEmployeeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const activeLocale = await getLocale();
  const t = await getTranslations("Admin");
  const tc = await getTranslations("Common");
  const tRole = await getTranslations("Role");
  const tBilling = await getTranslations("BillingCycle");
  const tInvoice = await getTranslations("Invoice");
  const tNav = await getTranslations("Nav");

  await requireAdmin();
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
          {" · "}
          {tRole(detail.employee.role)}
          {detail.employee.active ? "" : ` · ${t("inactiveSuffix")}`}
        </p>
      </div>

      <EmployeeManageForm employee={detail.employee} />

      <section className="space-y-3">
        <h2 className="text-lg font-medium">{t("subscriptions")}</h2>
        <p className="text-sm text-muted-foreground">{t("subscriptionsPauseHint")}</p>
        <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tc("tool")}</TableHead>
                <TableHead>{tInvoice("plan")}</TableHead>
                <TableHead>{tInvoice("billingCycle")}</TableHead>
                <TableHead className="text-right">{t("monthly")}</TableHead>
                <TableHead>{tc("status")}</TableHead>
                <TableHead>{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>{sub.tool?.name}</TableCell>
                  <TableCell>{sub.plan}</TableCell>
                  <TableCell>
                    {tBilling(sub.billing_cycle as "monthly")}
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
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">{tNav("invoices")}</h2>
        <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoice")}</TableHead>
                <TableHead>{tc("tool")}</TableHead>
                <TableHead>{tc("amount")}</TableHead>
                <TableHead>{tc("status")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    {t("noInvoicesForEmployee")}
                  </TableCell>
                </TableRow>
              ) : (
                detail.invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <Link
                        href={`/admin/invoices/${inv.id}`}
                        className="font-medium text-[var(--brand-deep)] hover:underline"
                      >
                        {inv.invoice_number ?? inv.file_name ?? t("invoice")}
                      </Link>
                    </TableCell>
                    <TableCell>{inv.tool?.name}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatEurForLocale(inv.amount, activeLocale)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <TableIconLink
                        href={`/admin/invoices/${inv.id}`}
                        label={tc("open")}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
