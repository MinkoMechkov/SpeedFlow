import { notFound } from "next/navigation";
import { InvoiceFilePreview } from "@/components/invoices/invoice-file-preview";
import { ValidationFlags } from "@/components/invoices/validation-flags";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { requireSession } from "@/lib/auth";
import { getMyInvoiceById } from "@/lib/data";
import { formatEurForLocale } from "@/lib/locale-format";
import { getInvoiceFileAccess } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

export default async function EmployeeInvoiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const activeLocale = await getLocale();
  const t = await getTranslations("Employee");
  const tInvoice = await getTranslations("Invoice");

  const session = await requireSession();
  const invoice = await getMyInvoiceById(session, id);
  if (!invoice) notFound();

  const file = await getInvoiceFileAccess({
    storagePath: invoice.storage_path,
    fileName: invoice.file_name,
  });

  const amountFormatted = formatEurForLocale(invoice.amount, activeLocale);
  const monthlyFormatted = formatEurForLocale(
    invoice.monthly_cost,
    activeLocale,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
            {invoice.invoice_number ??
              invoice.file_name ??
              t("invoiceDetail")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {invoice.tool?.name ?? tInvoice("tool")} · {amountFormatted}
          </p>
        </div>
        <Link
          href="/employee/invoices"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("backToInvoices")}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={invoice.status} />
        <span className="text-sm text-muted-foreground">
          {t("monthlyAmount", { amount: monthlyFormatted })}
        </span>
      </div>

      <ValidationFlags flags={invoice.validation_flags} />

      <InvoiceFilePreview file={file} />
    </div>
  );
}
