import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { markMonthlyCostsPaid } from "@/lib/data";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.employee.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { months?: number };
    const months = Number(body.months ?? 1);
    if (![1, 2, 3].includes(months)) {
      return NextResponse.json(
        { error: "months must be 1, 2, or 3" },
        { status: 400 },
      );
    }
    const result = await markMonthlyCostsPaid({ session, months });
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
