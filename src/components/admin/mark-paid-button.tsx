"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

export function MarkPaidButton({
  months,
  unpaidTotal,
  employeeId,
  employeeName,
  size = "default",
}: {
  months: number;
  unpaidTotal: number;
  employeeId?: string;
  employeeName?: string;
  size?: "default" | "sm";
}) {
  const t = useTranslations("Admin");
  const tCommon = useTranslations("Common");
  const tErrors = useTranslations("Errors");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const perEmployee = Boolean(employeeId);

  async function onClick() {
    if (unpaidTotal <= 0) {
      toast.message(
        perEmployee ? t("nothingUnpaidEmployee") : t("nothingUnpaidRange"),
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
      if (!res.ok) throw new Error(data.error ?? tErrors("markPaidFailed"));
      toast.success(
        data.updated
          ? perEmployee && employeeName
            ? t("markedPaidEmployee", {
                count: data.updated,
                name: employeeName,
              })
            : t("markedPaid", { count: data.updated })
          : perEmployee
            ? t("noUnpaidEmployee")
            : t("noUnpaidRange"),
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tErrors("failed"));
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
        ? tCommon("updating")
        : perEmployee
          ? t("markPaid")
          : t("markRangePaid")}
    </Button>
  );
}
