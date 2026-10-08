# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

SpendFlow is an internal app for employee tool subscriptions and invoice reimbursements: **Upload → Analyze (AI extraction) → Review (admin) → Calculate (monthly cost) → Report (CSV / mark paid)**. Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui (on `@base-ui/react`), Supabase (Auth, Postgres + RLS, Storage), `next-intl`.

`PROGRESS.md` is the living done/not-done checklist, with known quirks and suggested next work. Update it when features land.

## Commands

```bash
npm run dev        # dev server on http://127.0.0.1:43127 (fixed port)
npm run build      # production build (also the type check)
npm run lint       # eslint
npm run test:calc  # the only test: plain node:assert script for monthly-cost math (tsx)
```

There is no test runner. `src/lib/invoices/calculate.test.ts` is a standalone assert script, so run any similar file with `npx tsx <file>`.

Supabase schema lives in `supabase/migrations/*.sql`. There is no local Supabase CLI config, so migrations are applied to the hosted project by hand. New tables or policies need a new timestamped migration that includes RLS.

## Architecture

### Dual mode: demo vs Supabase
`isDemoMode()` in `src/lib/mode.ts` is true when `DEMO_MODE=true`, or when the Supabase URL/key env vars are missing. **Every data function must handle both modes:**
- **Demo:** an in-memory store on `globalThis` (`src/lib/demo/store.ts`) with seeded personas. Auth is the `spendflow_demo_session` cookie, which holds an employee id (`e-admin` is the admin). The store resets on server restart. Storage holds a virtual path only, so file preview, registration and password reset are unavailable.
- **Supabase:** the authenticated server client (`src/lib/supabase/server.ts`), with RLS enforcing access. Employees see their own rows and admins see company-wide rows.

`src/lib/data.ts` is the single data-access layer. Each exported function branches on `isDemoMode()` and implements both paths, so keep them behaviorally in sync. Pages and API routes call it rather than Supabase directly.

### Auth and authorization
- `src/middleware.ts` composes next-intl routing with an auth gate for `/employee` and `/admin` (paths are checked after the locale is stripped). It deliberately does not query the DB for the role: in Supabase mode it only verifies the JWT via `getClaims()`, and the role check happens server-side. It duplicates the demo-mode detection logic, so keep it in sync with `mode.ts`. Next.js warns that `middleware` should migrate to `proxy`.
- `src/lib/auth.ts`: `getSessionUser` is wrapped in React `cache()` and resolves the role from `employees.user_id`. Use `requireSession` / `requireAdmin` in server components.
- Ownership always comes from the session, never from the client payload (for example, `employee_id` on upload). Role checks for admin mutations are also repeated inside `data.ts`.
- Self-registration always creates `role = employee` (via a DB trigger on auth signup). Only admins can promote other users.

### Invoice pipeline (`src/lib/invoices/`)
- `extract.ts` runs Gemini extraction on the PDF/image bytes (`GEMINI_API_KEY`, `GEMINI_MODEL`). With no key, it returns deterministic mock JSON. In mock mode, the filename keywords `raise` / `mismatch` / `lowconf` trigger validation cases. With a key set, a Gemini failure makes the upload fail rather than fall back to the mock.
- `currency.ts` converts everything to EUR. USD always uses the fixed company rate `USD_TO_EUR = 0.8616`. Other currencies use the Frankfurter API with static fallbacks.
- `validate.ts` produces validation flag codes, and `flags.ts` maps each code to a tone plus i18n keys. A new flag needs a catalog entry and messages in both locales.
- `calculate.ts` is deterministic monthly-cost math. It prefers the day-span of the billing period (~30 days = 1 month) over the billing-cycle divisor. It is covered by `test:calc`.
- `processInvoiceUpload` / `reviewInvoice` in `data.ts` orchestrate the pipeline. Supabase-mode uploads go to the `invoices` Storage bucket at `{employeeId}/{timestamp}-{name}`, and admin approval creates or updates the subscription and its `monthly_costs` rows, plus an audit log entry. Demo mode creates a pending subscription at upload time instead.

### Routing and i18n
- Pages live under `src/app/[locale]/` with locales `bg` (default) and `en`, and the locale prefix is always present (`/bg/...`). API routes in `src/app/api/*` and `src/app/auth/callback` have no locale prefix.
- Use the locale-aware `Link` / `redirect` / `useRouter` from `src/i18n/navigation.ts`, not the ones from `next/navigation`.
- All UI strings come from `messages/bg.json` and `messages/en.json`, and both must be updated together. For money and dates, use the helpers in `src/lib/locale-format.ts`.
- `next.config.ts` aliases `next-intl/config` manually instead of using `createNextIntlPlugin`, which pulls in `@swc/core` and breaks on this host. Don't switch back to the plugin.

### UI conventions
- Areas: `/employee/*` and `/admin/*`, each with its own `layout.tsx` + `template.tsx`. The template sits under each area rather than at the root, so the app shell and pollers stay mounted across navigations.
- Every route has a `loading.tsx` skeleton (`src/components/page-skeletons.tsx`).
- Live updates use polling, not realtime: `pending-queue-watcher.tsx` polls `/api/admin/pending-count`, and `invoice-status-watcher.tsx` polls `/api/me/invoice-status`.
- First-login spotlight tour (`driver.js`) is mounted in the employee/admin layouts via `OnboardingTour`. Targets use `data-tour` attributes on nav items / mobile menu / user menu. Completion is stored in `user_onboarding` (demo: `store.onboarding`) and cached in `localStorage`. Bump `TOUR_VERSION` in `src/lib/onboarding.ts` to re-show after a major UI change. Replay from the user menu.
- `Button` has a `loading` prop for async actions. Toasts use `sonner`.
