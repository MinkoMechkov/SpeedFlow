import Link from "next/link";
import { LoginPanel } from "@/components/login-panel";
import { getDemoStore } from "@/lib/demo/store";
import { isDemoMode } from "@/lib/mode";

export default function LoginPage() {
  const demoMode = isDemoMode();
  const demoUsers = demoMode ? getDemoStore().employees : [];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <Link
        href="/"
        className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand)]"
      >
        SpendFlow
      </Link>
      <p className="mt-2 text-muted-foreground">
        Sign in to manage subscriptions and reimbursements.
      </p>
      <div className="mt-8 rounded-2xl border border-border/80 bg-card/70 p-6 shadow-sm backdrop-blur">
        <LoginPanel demoMode={demoMode} demoUsers={demoUsers} />
      </div>
    </div>
  );
}
