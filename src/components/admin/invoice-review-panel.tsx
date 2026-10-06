"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import type { BillingCycle, Invoice } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

export function InvoiceReviewPanel({ invoice }: { invoice: Invoice }) {
  const router = useRouter();
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
      router.refresh();
      if (action !== "edit") router.push("/admin/invoices");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setLoading(null);
    }
  }

  return (
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
        {invoice.validation_flags.length > 0 && (
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
            Flags: {invoice.validation_flags.join(", ")}
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-xl border border-border/80 bg-card/60 p-5">
        <h3 className="font-medium">Edit extracted fields</h3>
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
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  billing_cycle: (v ?? "monthly") as BillingCycle,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["monthly", "quarterly", "yearly", "semi_annual", "other"].map(
                  (c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button disabled={!!loading} onClick={() => submit("approve")}>
            {loading === "approve" ? "Approving…" : "Approve"}
          </Button>
          <Button
            variant="outline"
            disabled={!!loading}
            onClick={() => submit("edit")}
          >
            {loading === "edit" ? "Saving…" : "Save edits"}
          </Button>
          <Button
            variant="destructive"
            disabled={!!loading}
            onClick={() => submit("reject")}
          >
            {loading === "reject" ? "Rejecting…" : "Reject"}
          </Button>
        </div>
      </div>
    </div>
  );
}
