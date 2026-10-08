import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { isDemoMode } from "@/lib/mode";

export default function ResetPasswordPage() {
  if (isDemoMode()) {
    return (
      <AuthShell
        title="Password reset"
        subtitle="Not available in demo mode."
      >
        <p className="text-sm text-muted-foreground">
          Use a demo persona on the{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--brand-deep)] underline-offset-4 hover:underline"
          >
            sign-in page
          </Link>
          .
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set new password"
      subtitle="Choose a new password for your SpendFlow account."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
