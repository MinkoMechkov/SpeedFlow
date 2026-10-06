import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoiceFilePreview } from "@/components/invoices/invoice-file-preview";
import { ValidationFlags } from "@/components/invoices/validation-flags";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { requireSession } from "@/lib/auth";
import { getMyInvoiceById } from "@/lib/data";
import { formatEur } from "@/lib/invoices/calculate";
import { getInvoiceFileAccess } from "@/lib/storage";
import { cn } from "@/lib/utils";

export default async function EmployeeInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const invoice = await getMyInvoiceById(session, id);
  if (!invoice) notFound();

  const file = await getInvoiceFileAccess({
    storagePath: invoice.storage_path,
    fileName: invoice.file_name,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
            {invoice.invoice_number ?? invoice.file_name ?? "Invoice"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {invoice.tool?.name ?? "Tool"} · {formatEur(invoice.amount)}
          </p>
        </div>
        <Link
          href="/employee/invoices"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Back to invoices
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={invoice.status} />
        <span className="text-sm text-muted-foreground">
          Monthly {formatEur(invoice.monthly_cost)}
        </span>
      </div>

      <ValidationFlags flags={invoice.validation_flags} />

      <InvoiceFilePreview file={file} />
    </div>
  );
}
