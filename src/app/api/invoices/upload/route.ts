import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { processInvoiceUpload } from "@/lib/data";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const toolId = String(form.get("toolId") ?? "");
  const file = form.get("file");

  if (!toolId || !(file instanceof File)) {
    return NextResponse.json(
      { error: "toolId and file are required" },
      { status: 400 },
    );
  }

  // Never trust employee id from client — ownership comes from session.
  try {
    const bytes = await file.arrayBuffer();
    const invoice = await processInvoiceUpload({
      session,
      toolId,
      fileName: file.name,
      fileBytes: bytes,
    });
    return NextResponse.json({ invoice });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
