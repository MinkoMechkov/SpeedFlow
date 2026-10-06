"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function MarkPaidButton({
  months,
  unpaidTotal,
}: {
  months: number;
  unpaidTotal: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (unpaidTotal <= 0) {
      toast.message("Nothing unpaid in this range");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/report/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to mark paid");
      toast.success(
        data.updated
          ? `Marked ${data.updated} cost row(s) as paid`
          : "No unpaid rows in this range",
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={loading || unpaidTotal <= 0}
      onClick={onClick}
      className="cursor-pointer"
    >
      {loading ? "Updating…" : "Mark range as paid"}
    </Button>
  );
}
