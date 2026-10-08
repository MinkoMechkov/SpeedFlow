"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "@/i18n/navigation";

export function DeleteInvoiceButton({
  invoiceId,
  redirectToList = false,
  size = "sm",
  iconOnly = false,
}: {
  invoiceId: string;
  redirectToList?: boolean;
  size?: "sm" | "default";
  iconOnly?: boolean;
}) {
  const t = useTranslations("Employee");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : t("deleteFailed"),
        );
      }
      toast.success(t("invoiceDeleted"));
      setOpen(false);
      if (redirectToList) {
        router.push("/employee/invoices");
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("deleteFailed"));
    } finally {
      setLoading(false);
    }
  }

  const triggerButton = (
    <Button
      type="button"
      variant={iconOnly ? "ghost" : "outline"}
      size={iconOnly ? "icon-sm" : size}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={() => setOpen(true)}
      aria-label={t("deleteInvoice")}
    >
      <Trash2 className="size-3.5" />
      {iconOnly ? null : t("deleteInvoice")}
    </Button>
  );

  return (
    <>
      {iconOnly ? (
        <Tooltip>
          <TooltipTrigger delay={200} render={triggerButton} />
          <TooltipContent side="top">{t("deleteInvoice")}</TooltipContent>
        </Tooltip>
      ) : (
        triggerButton
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={!loading}>
          <DialogHeader>
            <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("deleteConfirmBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              loading={loading}
              onClick={() => void onDelete()}
            >
              {loading ? t("deletingInvoice") : t("deleteInvoice")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
