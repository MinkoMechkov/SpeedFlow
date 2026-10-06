import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateEmployee } from "@/lib/data";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  if (!session || session.employee.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      department?: string | null;
      role?: "employee" | "admin";
      active?: boolean;
    };

    if (body.role === "admin" && session.employee.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can grant admin role" },
        { status: 403 },
      );
    }

    const employee = await updateEmployee({
      session,
      employeeId: id,
      patch: {
        name: body.name,
        department: body.department,
        role: body.role,
        active: body.active,
      },
    });

    return NextResponse.json({ employee });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 },
    );
  }
}
