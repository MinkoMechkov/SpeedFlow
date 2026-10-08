import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getMyInvoiceStatuses } from "@/lib/data";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await getMyInvoiceStatuses(session);
    return NextResponse.json({ items });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
