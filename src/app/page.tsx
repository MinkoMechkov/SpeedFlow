import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const session = await getSessionUser();
  if (session) {
    redirect(
      session.employee.role === "admin" ? "/admin" : "/employee/subscriptions",
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="hero-glow pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[color-mix(in_oklab,var(--brand)_28%,transparent)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[color-mix(in_oklab,#c4a35a_22%,transparent)] blur-3xl" />

      <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-16">
        <p className="animate-rise font-[family-name:var(--font-display)] text-5xl tracking-tight text-[var(--brand)] sm:text-7xl">
          SpendFlow
        </p>
        <h1 className="animate-rise-delay mt-4 max-w-2xl text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
          Subscription invoices in. Monthly reimbursements out.
        </h1>
        <p className="animate-rise-delay mt-4 max-w-xl text-muted-foreground">
          Upload → Analyze → Review → Calculate → Report. Employees stay in
          their own lane; finance gets a clean monthly export.
        </p>
        <div className="animate-rise-delay mt-8 flex flex-wrap gap-3">
          <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>
            Open portal
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Demo as employee or admin
          </Link>
        </div>
      </main>
    </div>
  );
}
