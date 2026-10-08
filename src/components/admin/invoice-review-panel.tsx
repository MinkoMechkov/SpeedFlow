"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { InvoiceFilePreview } from "@/components/invoices/invoice-file-preview";
import { ValidationFlags } from "@/components/invoices/validation-flags";
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
import { formatEur } from "@/lib/invoices/calculate";
import type { InvoiceFileAccess } from "@/lib/storage";
import type { BillingCycle, Invoice } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

export function InvoiceReviewPanel({
  invoice,
  file,
}: {
  invoice: Invoice;
  file: InvoiceFileAccess;
}) {
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
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(
        action === "approve"
          ? "Invoice approved"
          : action === "reject"
            ? "Invoice rejected"
            : "Edits saved",
      );
      if (action !== "edit") {
        router.push("/admin/invoices");
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      <InvoiceFilePreview file={file} />

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-xl border border-border/80 bg-card/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Invoice</p>
              <h2 className="font-[family-name:var(--font-display)] text-2xl">
                {invoice.invoice_number ?? invoice.id}
              </h2>
            </div>
            <StatusBadge status={invoice.status} />
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Employee</dt>
              <dd className="font-medium">{invoice.employee?.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tool</dt>
              <dd className="font-medium">{invoice.tool?.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">AI confidence</dt>
              <dd className="font-medium">
                {invoice.ai_confidence != null
                  ? `${Math.round(invoice.ai_confidence * 100)}%`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Calculated monthly</dt>
              <dd className="font-medium">{formatEur(invoice.monthly_cost)}</dd>
            </div>
          </dl>
          <ValidationFlags flags={invoice.validation_flags} />
        </div>

        <div className="space-y-4 rounded-xl border border-border/80 bg-card/60 p-5">
          <h3 className="font-medium">
            {readOnly ? "Extracted fields" : "Edit extracted fields"}
          </h3>
          {readOnly ? (
            <p className="text-sm text-muted-foreground">
              This invoice is {invoice.status.replace("_", " ")}. Re-open edits
              are disabled; use the original file above for audit.
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["invoice_number", "Invoice #"],
                ["invoice_date", "Invoice date"],
                ["period_start", "Period start"],
                ["period_end", "Period end"],
                ["plan", "Plan"],
                ["amount", "Amount"],
                ["currency", "Currency"],
                ["tax_amount", "Tax"],
              ] as const
            ).map(([key, label]) => (
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
              <Label>Billing cycle</Label>
              <Select
                value={form.billing_cycle}
                disabled={readOnly}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    billing_cycle: (v ?? "monthly") as BillingCycle,
                  }))
                }
                items={{
                  monthly: "monthly",
                  quarterly: "quarterly",
                  yearly: "yearly",
                  semi_annual: "semi_annual",
                  other: "other",
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "monthly",
                    "quarterly",
                    "yearly",
                    "semi_annual",
                    "other",
                  ].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
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
                {loading === "approve" ? "Approving…" : "Approve"}
              </Button>
              <Button
                variant="outline"
                disabled={!!loading}
                loading={loading === "edit"}
                onClick={() => submit("edit")}
              >
                {loading === "edit" ? "Saving…" : "Save edits"}
              </Button>
              <Button
                variant="destructive"
                disabled={!!loading}
                loading={loading === "reject"}
                onClick={() => submit("reject")}
              >
                {loading === "reject" ? "Rejecting…" : "Reject"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
