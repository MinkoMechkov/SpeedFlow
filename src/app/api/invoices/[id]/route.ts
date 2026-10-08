import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { deleteMyInvoice, InvoiceDeleteError } from "@/lib/data";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await deleteMyInvoice({ session, invoiceId: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof InvoiceDeleteError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 },
    );
  }
}
