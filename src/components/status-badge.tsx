import { Badge } from "@/components/ui/badge";

const MAP: Record<string, string> = {
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  uploaded: "Uploaded",
  extracting: "Extracting",
  active: "Active",
  paused: "Paused",
  cancelled: "Cancelled",
  pending: "Pending",
};

export function StatusBadge({ status }: { status: string }) {
  const label = MAP[status] ?? status;
  const variant =
    status === "approved" || status === "active"
      ? "default"
      : status === "rejected" || status === "cancelled"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{label}</Badge>;
}
