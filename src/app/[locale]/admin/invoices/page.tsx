import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { requireAdmin } from "@/lib/auth";
import {
  listInvoices,
  type AdminInvoiceStatusFilter,
} from "@/lib/data";
import { formatEurForLocale } from "@/lib/locale-format";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

function parseStatus(
  value: string | string[] | undefined,
): AdminInvoiceStatusFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  if (
    raw === "all" ||
    raw === "approved" ||
    raw === "rejected" ||
    raw === "pending_review"
  ) {
    return raw;
  }
  return "pending_review";
}

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminInvoicesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const activeLocale = await getLocale();
  const t = await getTranslations("Admin");
  const tc = await getTranslations("Common");

  await requireAdmin();
  const query = await searchParams;
  const status = parseStatus(query.status);
  const invoices = await listInvoices({ status });

  const STATUS_FILTERS: { value: AdminInvoiceStatusFilter; label: string }[] = [
    { value: "pending_review", label: t("filterPending") },
    { value: "approved", label: t("filterApproved") },
    { value: "rejected", label: t("filterRejected") },
    { value: "all", label: t("filterAll") },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          {t("reviewsTitle")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("reviewsSubtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((opt) => {
          const active = opt.value === status;
          return (
            <Link
              key={opt.value}
              href={`/admin/invoices?status=${opt.value}`}
              className={cn(
                buttonVariants({ variant: active ? "default" : "outline" }),
                "cursor-pointer",
              )}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      {invoices.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-10 text-center text-muted-foreground">
          {status === "pending_review" ? t("queueClear") : t("noInvoices")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoice")}</TableHead>
                <TableHead>{tc("employee")}</TableHead>
                <TableHead>{tc("tool")}</TableHead>
                <TableHead>{tc("amount")}</TableHead>
                <TableHead>{t("monthly")}</TableHead>
                <TableHead>{t("aiConfidence")}</TableHead>
                <TableHead>{tc("status")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">
                    {inv.invoice_number}
                  </TableCell>
                  <TableCell>{inv.employee?.name}</TableCell>
                  <TableCell>{inv.tool?.name}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatEurForLocale(inv.amount, activeLocale)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatEurForLocale(inv.monthly_cost, activeLocale)}
                  </TableCell>
                  <TableCell>
                    {inv.ai_confidence != null
                      ? `${Math.round(inv.ai_confidence * 100)}%`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={inv.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/invoices/${inv.id}`}
                      className="text-sm text-[var(--brand-deep)] hover:underline"
                    >
                      {tc("open")}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
