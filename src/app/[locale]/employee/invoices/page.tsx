import { DeleteInvoiceButton } from "@/components/employee/delete-invoice-button";
import { StatusBadge } from "@/components/status-badge";
import { TableIconLink } from "@/components/table-icon-link";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { requireSession } from "@/lib/auth";
import { getMyInvoices } from "@/lib/data";
import { formatEurForLocale } from "@/lib/locale-format";
import { cn } from "@/lib/utils";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function EmployeeInvoicesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const activeLocale = await getLocale();
  const t = await getTranslations("Employee");
  const tCommon = await getTranslations("Common");
  const tInvoice = await getTranslations("Invoice");

  const session = await requireSession();
  const invoices = await getMyInvoices(session);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
            {t("invoicesTitle")}
          </h1>
          <p className="mt-1 text-muted-foreground">{t("invoicesSubtitle")}</p>
        </div>
        <Link
          href="/employee/invoices/upload"
          className={cn(buttonVariants())}
        >
          {t("uploadCta")}
        </Link>
      </div>

      {invoices.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-muted-foreground">
          {t("noInvoices")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tInvoice("invoiceNumber")}</TableHead>
                <TableHead>{tCommon("tool")}</TableHead>
                <TableHead>{tCommon("amount")}</TableHead>
                <TableHead>{t("monthly")}</TableHead>
                <TableHead>{tCommon("status")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">
                    {inv.invoice_number ?? inv.file_name}
                  </TableCell>
                  <TableCell>{inv.tool?.name ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatEurForLocale(inv.amount, activeLocale)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatEurForLocale(inv.monthly_cost, activeLocale)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={inv.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-end gap-0.5">
                      <TableIconLink
                        href={`/employee/invoices/${inv.id}`}
                        label={tCommon("open")}
                      />
                      {inv.status !== "approved" ? (
                        <DeleteInvoiceButton invoiceId={inv.id} iconOnly />
                      ) : null}
                    </div>
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
