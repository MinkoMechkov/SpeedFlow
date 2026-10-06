import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/register-form";
import { buttonVariants } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/mode";
import { cn } from "@/lib/utils";

const FLOW = ["Upload", "Analyze", "Review", "Calculate", "Report"] as const;

export default async function HomePage() {
  const session = await getSessionUser();
  if (session) {
    redirect(
      session.employee.role === "admin" ? "/admin" : "/employee/subscriptions",
    );
  }

  const demo = isDemoMode();

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="hero-glow pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[color-mix(in_oklab,var(--brand)_35%,transparent)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[color-mix(in_oklab,#c4a35a_18%,transparent)] blur-3xl" />

      <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-12 px-6 py-16 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="animate-rise font-[family-name:var(--font-display)] text-5xl tracking-tight text-[var(--brand)] sm:text-7xl">
            SpendFlow
          </p>
          <h1 className="animate-rise-delay mt-4 text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            Subscription invoices in. Monthly reimbursements out.
          </h1>
          <p className="animate-rise-delay mt-4 text-muted-foreground">
            Employees upload invoices in their own lane. Finance reviews once
            and exports a clean monthly reimbursement report.
          </p>

          <ol className="animate-rise-delay mt-8 flex flex-wrap items-center gap-2">
            {FLOW.map((step, index) => (
              <li key={step} className="flex items-center gap-2">
                <span className="rounded-full border border-[color-mix(in_oklab,var(--brand)_55%,transparent)] bg-[color-mix(in_oklab,var(--brand)_18%,white)] px-3 py-1 text-xs font-medium text-foreground">
                  {step}
                </span>
                {index < FLOW.length - 1 ? (
                  <span className="text-muted-foreground" aria-hidden>
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>

          <div className="animate-rise-delay mt-8 flex flex-wrap gap-3">
            <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>
              Sign in
            </Link>
            {demo ? (
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                )}
              >
                Demo personas
              </Link>
            ) : null}
          </div>
        </div>

        <div className="animate-rise-delay w-full max-w-md shrink-0">
          <div className="rounded-2xl border border-border/80 bg-card/80 p-6 shadow-sm backdrop-blur">
            {demo ? (
              <div className="text-sm text-muted-foreground">
                Registration is available when Supabase mode is on (
                <code className="text-xs">DEMO_MODE=false</code>). Use{" "}
                <Link href="/login" className="text-[var(--brand-deep)]">
                  Login
                </Link>{" "}
                to pick a demo persona.
              </div>
            ) : (
              <RegisterForm />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
