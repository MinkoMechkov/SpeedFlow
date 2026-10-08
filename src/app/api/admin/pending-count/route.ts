import { NextResponse } from "next/server";
import { getSessionUserNoRefresh } from "@/lib/auth";
import { getPendingReviewCount } from "@/lib/data";

export async function GET() {
  // No token refresh — avoids racing approve/reject refresh-token rotation.
  const session = await getSessionUserNoRefresh();
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
