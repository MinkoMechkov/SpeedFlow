import { guessMime } from "@/lib/mime";
import { isDemoMode } from "@/lib/mode";
import { createClient } from "@/lib/supabase/server";

export type InvoiceFileAccess = {
  url: string | null;
  mimeType: string | null;
  fileName: string | null;
  /** Why preview is unavailable when url is null. */
  reason: string | null;
};

/** Short-lived signed URL for an invoice file in Supabase Storage. */
export async function getInvoiceFileAccess(input: {
  storagePath: string | null | undefined;
  fileName: string | null | undefined;
  expiresInSeconds?: number;
}): Promise<InvoiceFileAccess> {
  const fileName = input.fileName ?? null;
  const mimeType = fileName ? guessMime(fileName) : null;

  if (isDemoMode()) {
    return {
      url: null,
      mimeType,
      fileName,
      reason: "File preview is unavailable in demo mode (virtual storage paths).",
    };
  }

  if (!input.storagePath || input.storagePath.startsWith("demo/")) {
    return {
      url: null,
      mimeType,
      fileName,
      reason: "No stored file for this invoice.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("invoices")
    .createSignedUrl(input.storagePath, input.expiresInSeconds ?? 3600);

  if (error || !data?.signedUrl) {
    console.warn("Signed URL failed", error);
    return {
      url: null,
      mimeType,
      fileName,
      reason: "Could not create a download link for this file.",
    };
  }

  return {
    url: data.signedUrl,
    mimeType,
    fileName,
    reason: null,
  };
}
