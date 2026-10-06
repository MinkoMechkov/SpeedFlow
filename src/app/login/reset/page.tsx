import { ResetPasswordForm } from "@/components/reset-password-form";
import { isDemoMode } from "@/lib/mode";
import Link from "next/link";

export default function ResetPasswordPage() {
  if (isDemoMode()) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <Link
          href="/"
          className="mb-4 text-sm text-muted-foreground transition hover:text-[var(--brand)]"
        >
          ← Back to home
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Password reset
        </h1>
        <p className="mt-2 text-muted-foreground">
          Not available in demo mode. Use a demo persona on{" "}
          <Link href="/login" className="text-[var(--brand)]">
            Login
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-12">
      <Link
        href="/"
        className="mb-4 text-sm text-muted-foreground transition hover:text-[var(--brand)]"
      >
        ← Back to home
      </Link>
      <ResetPasswordForm />
    </div>
  );
}
