# SpendFlow

Internal platform for employee tool subscriptions and invoice reimbursements.

**Upload → Analyze → Review → Calculate → Report**

## Stack

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- Supabase Auth, PostgreSQL, Storage, RLS
- Deterministic monthly-cost math in app code
- Mock AI extraction when no `GEMINI_API_KEY`
- In-memory **demo mode** when `DEMO_MODE=true` (or Supabase env vars missing)

## Quick start (demo)

```bash
npm install
cp .env.example .env.local   # DEMO_MODE=true by default
npm run dev                  # http://127.0.0.1:43127
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127), go to **Login**, and pick:

| Persona | Role |
|---|---|
| Ana Finance | Admin |
| Ivan Petrov | Employee |
| Maria Ivanova | Employee |
| Georgi Georgiev | Employee |

### Demo walkthrough

1. Sign in as **Ivan Petrov** → view subscriptions & reimbursement
2. **Upload** an invoice (any PDF/image; filename can include `raise` / `mismatch` / `lowconf` to exercise validation)
3. Sign out → sign in as **Ana Finance**
4. **Reviews** → approve/edit/reject → check audit log on dashboard
5. **Report** → export CSV

## Supabase mode

1. Create a Supabase project and apply migrations under `supabase/migrations/`
2. Set in `.env.local`:

```env
DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# Optional: used for password-reset email links (defaults to request origin)
NEXT_PUBLIC_APP_URL=http://127.0.0.1:43127
```

3. **Auth (internal MVP):** In Supabase Dashboard → Authentication → Providers → Email, **disable “Confirm email”** so home-page registration can sign in immediately. Self-signup always creates `employees.role = employee`; only admins can promote admins in-app.
4. Optional: seed an admin Auth user + matching `employees` row (`role = admin`)
5. Optional: `GEMINI_API_KEY` (+ `GEMINI_MODEL`) for live Gemini extraction

Schema includes RLS so employees only read/upload their own data; admins see company-wide records. Invoice ownership is always derived from the authenticated session — never from the client payload.

Password reset: Login → Forgot password → email link → `/auth/callback` → `/login/reset`.
In Supabase Dashboard → Authentication → URL Configuration, allow redirect URLs for
`http://127.0.0.1:43127/auth/callback` (and your production origin).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server on port **43127** |
| `npm run build` | Production build |
| `npm run test:calc` | Monthly-cost unit checks |

## What’s mocked

- **Demo auth + data store** when `DEMO_MODE=true`
- **AI extraction** when `GEMINI_API_KEY` is unset (deterministic mock JSON). With a key set, failed Gemini calls error the upload instead of silently mocking.
- File storage uses Supabase Storage when not in demo mode; demo stores a virtual path only
