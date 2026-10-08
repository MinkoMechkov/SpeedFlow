"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

const KNOWN = [
  "pending_review",
  "approved",
  "rejected",
  "uploaded",
  "extracting",
  "active",
  "paused",
  "cancelled",
  "pending",
] as const;

export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("Status");
  const label = (KNOWN as readonly string[]).includes(status)
    ? t(status as (typeof KNOWN)[number])
    : status;
  const variant =
    status === "approved" || status === "active"
      ? "default"
      : status === "rejected" || status === "cancelled"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{label}</Badge>;
}
