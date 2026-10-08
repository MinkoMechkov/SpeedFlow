import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { markTourCompleted } from "@/lib/data";
import { TOUR_VERSION } from "@/lib/onboarding";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { version?: unknown } = {};
  try {
    body = (await request.json()) as { version?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const version =
    typeof body.version === "number" ? body.version : TOUR_VERSION;
  if (!Number.isInteger(version) || version < 1) {
    return NextResponse.json({ error: "Invalid version" }, { status: 400 });
  }

  try {
    await markTourCompleted(session, version);
    return NextResponse.json({ ok: true, version });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}