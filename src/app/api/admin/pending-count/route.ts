import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPendingReviewCount } from "@/lib/data";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.employee.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const count = await getPendingReviewCount();
    return NextResponse.json({ count });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
