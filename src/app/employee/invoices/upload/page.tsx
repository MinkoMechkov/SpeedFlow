import { UploadForm } from "@/components/employee/upload-form";
import { requireSession } from "@/lib/auth";
import { listTools } from "@/lib/data";

export default async function UploadInvoicePage() {
  await requireSession();
  const tools = await listTools();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Upload invoice
        </h1>
        <p className="mt-1 text-muted-foreground">
          AI extracts structured fields; SpendFlow calculates the monthly cost
          deterministically.
        </p>
      </div>
      <div className="rounded-xl border border-border/80 bg-card/60 p-5">
        <UploadForm tools={tools} />
      </div>
    </div>
  );
}
