import { AuthShell } from "@/components/auth-shell";
import { LoginPanel } from "@/components/login-panel";
import { getDemoStore } from "@/lib/demo/store";
import { isDemoMode } from "@/lib/mode";

export default function LoginPage() {
  const demoMode = isDemoMode();
  const demoUsers = demoMode ? getDemoStore().employees : [];

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage subscriptions and reimbursements."
    >
      <LoginPanel demoMode={demoMode} demoUsers={demoUsers} />
    </AuthShell>
  );
}
