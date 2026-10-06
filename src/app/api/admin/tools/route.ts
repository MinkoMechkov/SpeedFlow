import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createTool, listTools } from "@/lib/data";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.employee.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const tools = await listTools();
  return NextResponse.json({ tools });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.employee.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { name?: string; vendor?: string };
    const tool = await createTool({
      name: String(body.name ?? ""),
      vendor: String(body.vendor ?? ""),
    });
    return NextResponse.json({ tool }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Create failed" },
      { status: 400 },
    );
  }
}
