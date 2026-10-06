import type { InvoiceFileAccess } from "@/lib/storage";

export function InvoiceFilePreview({ file }: { file: InvoiceFileAccess }) {
  if (!file.url) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 px-4 py-10 text-center text-sm text-muted-foreground">
        {file.reason ?? "No file available."}
      </div>
    );
  }

  const isImage = file.mimeType?.startsWith("image/");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">Original file</h3>
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--brand)] underline-offset-2 hover:underline"
        >
          Download{file.fileName ? ` · ${file.fileName}` : ""}
        </a>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/80 bg-muted/30">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.url}
            alt={file.fileName ?? "Invoice"}
            className="max-h-[70vh] w-full object-contain"
          />
        ) : (
          <iframe
            title={file.fileName ?? "Invoice PDF"}
            src={file.url}
            className="h-[70vh] w-full bg-white"
          />
        )}
      </div>
    </div>
  );
}
