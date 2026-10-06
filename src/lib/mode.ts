/** Demo mode when explicitly enabled or Supabase public env is incomplete. */
export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === "true") return true;
  if (process.env.DEMO_MODE === "false") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return !url || !key;
}

export function hasLlmKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}
