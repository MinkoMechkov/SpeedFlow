import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row sm:px-6">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-sm tracking-tight text-[var(--brand-deep)] transition hover:text-foreground"
          >
            SpendFlow
          </Link>
          <p className="text-xs text-muted-foreground">
            Subscription invoices → monthly reimbursements
          </p>
        </div>
        <p className="text-xs text-muted-foreground">© {year}</p>
      </div>
    </footer>
  );
}
