"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import type { SubscriptionStatus } from "@/lib/types";

const ACTIONS: {
  status: "active" | "paused" | "cancelled";
  labelKey: "pause" | "cancel" | "reactivate";
  when: SubscriptionStatus[];
}[] = [
  { status: "paused", labelKey: "pause", when: ["active", "pending"] },
  {
    status: "cancelled",
    labelKey: "cancel",
    when: ["active", "paused", "pending"],
  },
  { status: "active", labelKey: "reactivate", when: ["paused", "cancelled"] },
];

export function SubscriptionStatusActions({
  subscriptionId,
  status,
}: {
  subscriptionId: string;
  status: SubscriptionStatus;
}) {
  const t = useTranslations("Subscription");
  const tErrors = useTranslations("Errors");
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
      if (!res.ok) throw new Error(data.error ?? tErrors("updateFailed"));
      toast.success(
        next === "active"
          ? t("reactivated")
          : next === "paused"
            ? t("paused")
            : t("cancelled"),
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tErrors("updateFailed"),
      );
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
          loading={loading === action.status}
          onClick={() => changeStatus(action.status)}
        >
          {t(action.labelKey)}
        </Button>
      ))}
    </div>
  );
}
