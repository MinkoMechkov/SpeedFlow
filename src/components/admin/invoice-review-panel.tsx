"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { InvoiceFilePreview } from "@/components/invoices/invoice-file-preview";
import { ValidationFlags } from "@/components/invoices/validation-flags";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { formatEurForLocale } from "@/lib/locale-format";
import type { InvoiceFileAccess } from "@/lib/storage";
import type { BillingCycle, Invoice } from "@/lib/types";

const CYCLES: BillingCycle[] = [
  "monthly",
  "quarterly",
  "yearly",
  "semi_annual",
  "other",
];

export function InvoiceReviewPanel({
  invoice,
  file,
}: {
  invoice: Invoice;
  file: InvoiceFileAccess;
}) {
  const t = useTranslations("Invoice");
  const tAdmin = useTranslations("Admin");
  const tCommon = useTranslations("Common");
  const tCycle = useTranslations("BillingCycle");
  const tErrors = useTranslations("Errors");
  const tStatus = useTranslations("Status");
  const locale = useLocale();
  const router = useRouter();
  const readOnly = invoice.status !== "pending_review";
  const [loading, setLoading] = useState<string | null>(null);
  const [form, setForm] = useState({
    invoice_number: invoice.invoice_number ?? "",
    invoice_date: invoice.invoice_date ?? "",
    period_start: invoice.period_start ?? "",
    period_end: invoice.period_end ?? "",
    billing_cycle: (invoice.billing_cycle ?? "monthly") as BillingCycle,
    plan: invoice.plan ?? "",
    amount: String(invoice.amount ?? ""),
    currency: invoice.currency ?? "EUR",
    tax_amount: String(invoice.tax_amount ?? ""),
  });

  async function submit(action: "approve" | "reject" | "edit") {
    if (readOnly) return;
    setLoading(action);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          edits: {
            ...form,
            amount: Number(form.amount),
            tax_amount: form.tax_amount ? Number(form.tax_amount) : null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? tErrors("failed"));
      toast.success(
        action === "approve"
          ? t("approved")
          : action === "reject"
            ? t("rejected")
            : t("editsSaved"),
      );
      if (action !== "edit") {
        router.push("/admin/invoices");
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tErrors("actionFailed"),
      );
    } finally {
      setLoading(null);
    }
  }

  const fieldDefs = [
    ["invoice_number", t("invoiceNumber")],
    ["invoice_date", t("invoiceDate")],
    ["period_start", t("periodStart")],
    ["period_end", t("periodEnd")],
    ["plan", t("plan")],
    ["amount", tCommon("amount")],
    ["currency", tCommon("currency")],
    ["tax_amount", t("tax")],
  ] as const;

  const statusLabel = tStatus(
    invoice.status as
      | "pending_review"
      | "approved"
      | "rejected"
      | "uploaded"
      | "extracting",
  );

  return (
    <div className="space-y-8">
      <InvoiceFilePreview file={file} />

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-xl border border-border/80 bg-card/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{t("invoiceNumber")}</p>
              <h2 className="font-[family-name:var(--font-display)] text-2xl">
                {invoice.invoice_number ?? invoice.id}
              </h2>
            </div>
            <StatusBadge status={invoice.status} />
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">{t("employee")}</dt>
              <dd className="font-medium">{invoice.employee?.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("tool")}</dt>
              <dd className="font-medium">{invoice.tool?.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{tAdmin("aiConfidence")}</dt>
              <dd className="font-medium">
                {invoice.ai_confidence != null
                  ? `${Math.round(invoice.ai_confidence * 100)}%`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {tAdmin("calculatedMonthly")}
              </dt>
              <dd className="font-medium">
                {formatEurForLocale(invoice.monthly_cost, locale)}
              </dd>
            </div>
          </dl>
          <ValidationFlags flags={invoice.validation_flags} />
        </div>

        <div className="space-y-4 rounded-xl border border-border/80 bg-card/60 p-5">
          <h3 className="font-medium">
            {readOnly ? t("extracted") : t("editExtracted")}
          </h3>
          {readOnly ? (
            <p className="text-sm text-muted-foreground">
              {tAdmin("readOnlyStatus", { status: statusLabel })}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {fieldDefs.map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={form[key]}
                  disabled={readOnly}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t("billingCycle")}</Label>
              <Select
                value={form.billing_cycle}
                disabled={readOnly}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    billing_cycle: (v ?? "monthly") as BillingCycle,
                  }))
                }
                items={Object.fromEntries(
                  CYCLES.map((c) => [c, tCycle(c)]),
                )}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CYCLES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {tCycle(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {!readOnly ? (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                disabled={!!loading}
                loading={loading === "approve"}
                onClick={() => submit("approve")}
              >
                {loading === "approve" ? t("approving") : t("approve")}
              </Button>
              <Button
                variant="outline"
                disabled={!!loading}
                loading={loading === "edit"}
                onClick={() => submit("edit")}
              >
                {loading === "edit" ? tCommon("saving") : t("saveEdits")}
              </Button>
              <Button
                variant="destructive"
                disabled={!!loading}
                loading={loading === "reject"}
                onClick={() => submit("reject")}
              >
                {loading === "reject" ? t("rejecting") : t("reject")}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
