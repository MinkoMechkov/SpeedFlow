import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateSubscriptionStatus } from "@/lib/data";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { status?: string };
    const status = body.status;
    if (
      status !== "active" &&
      status !== "paused" &&
      status !== "cancelled"
    ) {
      return NextResponse.json(
        { error: 'status must be "active", "paused", or "cancelled"' },
        { status: 400 },
      );
    }

    const subscription = await updateSubscriptionStatus({
      session,
      subscriptionId: id,
      status,
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Update failed";
    const status =
      message === "Forbidden"
        ? 403
        : message === "Subscription not found"
          ? 404
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
