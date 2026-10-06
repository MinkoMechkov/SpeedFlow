import { notFound } from "next/navigation";
import { InvoiceReviewPanel } from "@/components/admin/invoice-review-panel";
import { requireAdmin } from "@/lib/auth";
import { getInvoiceById } from "@/lib/data";
import { getInvoiceFileAccess } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function AdminInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
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
          {invoice.status === "pending_review" ? "Review invoice" : "Invoice"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Edits are audited. Monthly cost is recalculated in app code, not by
          AI.
        </p>
      </div>
      <InvoiceReviewPanel invoice={invoice} file={file} />
    </div>
  );
}
