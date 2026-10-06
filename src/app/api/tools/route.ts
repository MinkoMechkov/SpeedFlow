import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createTool } from "@/lib/data";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      vendor?: string;
    };
    const name = String(body.name ?? "").trim();
    const vendor = String(body.vendor ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const tool = await createTool({ name, vendor });
    return NextResponse.json({ tool });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create tool" },
      { status: 500 },
    );
  }
}
