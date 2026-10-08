"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function MarkPaidButton({
  months,
  unpaidTotal,
  employeeId,
  employeeName,
  size = "default",
}: {
  months: number;
  unpaidTotal: number;
  /** When set, only this employee's unpaid rows are marked paid. */
  employeeId?: string;
  employeeName?: string;
  size?: "default" | "sm";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const perEmployee = Boolean(employeeId);

  async function onClick() {
    if (unpaidTotal <= 0) {
      toast.message(
        perEmployee
          ? "Nothing unpaid for this employee in this range"
          : "Nothing unpaid in this range",
      );
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/report/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          months,
          ...(employeeId ? { employeeId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to mark paid");
      const who = employeeName ? ` for ${employeeName}` : "";
      toast.success(
        data.updated
          ? `Marked ${data.updated} cost row(s) as paid${who}`
          : perEmployee
            ? "No unpaid rows for this employee"
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
      size={size}
      disabled={unpaidTotal <= 0}
      loading={loading}
      onClick={onClick}
      className="cursor-pointer"
    >
      {loading
        ? "Updating…"
        : perEmployee
          ? "Mark paid"
          : "Mark range as paid"}
    </Button>
  );
}
