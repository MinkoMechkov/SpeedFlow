import { notFound } from "next/navigation";
import { InvoiceReviewPanel } from "@/components/admin/invoice-review-panel";
import { requireAdmin } from "@/lib/auth";
import { getInvoiceById } from "@/lib/data";
import { getInvoiceFileAccess } from "@/lib/storage";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AdminInvoiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Admin");

  await requireAdmin();
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  const file = await getInvoiceFileAccess({
    storagePath: invoice.storage_path,
    fileName: invoice.file_name,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          {invoice.status === "pending_review"
            ? t("reviewInvoiceTitle")
            : t("invoice")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("invoiceEditsHint")}</p>
      </div>
      <InvoiceReviewPanel invoice={invoice} file={file} />
    </div>
  );
}
