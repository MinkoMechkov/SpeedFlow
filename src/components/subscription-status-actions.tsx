"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { SubscriptionStatus } from "@/lib/types";

const ACTIONS: {
  status: "active" | "paused" | "cancelled";
  label: string;
  when: SubscriptionStatus[];
}[] = [
  { status: "paused", label: "Pause", when: ["active", "pending"] },
  { status: "cancelled", label: "Cancel", when: ["active", "paused", "pending"] },
  { status: "active", label: "Reactivate", when: ["paused", "cancelled"] },
];

export function SubscriptionStatusActions({
  subscriptionId,
  status,
}: {
  subscriptionId: string;
  status: SubscriptionStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const available = ACTIONS.filter((a) => a.when.includes(status));

  if (available.length === 0) return null;

  async function changeStatus(next: "active" | "paused" | "cancelled") {
    setLoading(next);
    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      toast.success(
        next === "active"
          ? "Subscription reactivated"
          : next === "paused"
            ? "Subscription paused"
            : "Subscription cancelled",
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {available.map((action) => (
        <Button
          key={action.status}
          type="button"
          size="sm"
          variant={action.status === "cancelled" ? "outline" : "secondary"}
          disabled={loading != null}
          onClick={() => changeStatus(action.status)}
        >
          {loading === action.status ? "…" : action.label}
        </Button>
      ))}
    </div>
  );
}
