# SpendFlow progress

Living checklist of what is done vs not. Update this as work lands.

Last reviewed: 2026-10-08

---

## Environment / setup

| Item | Status | Notes |
|---|---|---|
| Local `npm install` + `npm run dev` | Done | Port `43127` |
| `.env.local` with Supabase project | Done | `DEMO_MODE=false`, project `spendflow` |
| Supabase project healthy | Done | Schema migration applied, RLS on |
| Auth users + `employees` rows | Done | Ana (admin), Ivan, Maria, Minko (employees) |
| Seeded subscriptions / invoices in Supabase | Partial | Real uploads exist; no bulk seed script |
| `GEMINI_API_KEY` for live extraction | Done | Default `gemini-3.1-flash-lite` (faster); mock only if key unset |
| Demo mode walkthrough | Done (available) | Set `DEMO_MODE=true` to use in-memory seed |
| Public registration | Done | Home page form; always creates `employee` |
| Confirm email disabled (MVP) | Manual | Dashboard → Auth → Email → disable “Confirm email” (see README) |

**Login (Supabase mode)**

| Role | Email | Password |
|---|---|---|
| Admin | `ana.finance@example.com` | `SpendFlow123!` |
| Employee | `ivan.petrov@example.com` | `SpendFlow123!` |
| Employee | `maria.ivanova@example.com` | `SpendFlow123!` |
| Employee | `minko.mechkov@example.com` | `SpendFlow123!` |

---

## Core product flow

Upload → Analyze → Review → Calculate → Report

- [x] Employee invoice upload API (session ownership, not client-supplied owner)
- [x] Extraction pipeline (mock by default; Gemini path if `GEMINI_API_KEY` set)
- [x] Validation flags (duplicate, name mismatch, price change, missing fields, etc.)
- [x] Flag descriptions UI (“Review notes” with tone + plain-language copy)
- [x] Deterministic monthly-cost calculation (app code)
- [x] Fixed USD→EUR company rate `0.8616` (same $ amount → same € every time)
- [x] Admin review: approve / edit / reject + audit log
- [x] Monthly reimbursement report + CSV export
- [x] Document AI via Gemini (PDF/image bytes + structured JSON; mock without key)
- [x] Invoice file preview / download on admin review (signed Storage URLs)
- [x] Employee invoice file preview (own files)
- [x] Mark reimbursements as paid (admin report range)
- [x] Mark single employee as paid within the report range (cash vs bank batch)
- [x] Pause / cancel / reactivate subscriptions (API + UI + audit; historical monthly_costs unchanged)
- [x] Live admin pending queue (poll + toast + refresh when count changes)
- [ ] Async extraction with `uploaded` / `extracting` status polling

---

## Auth & access

- [x] Demo auth (cookie + persona picker when `DEMO_MODE=true`)
- [x] Supabase email/password login
- [x] Public registration on index (always `role=employee`)
- [x] Middleware protection for `/employee` and `/admin`
- [x] Role resolution via `employees.user_id` (`employee` \| `admin`)
- [x] RLS policies in migration (own data vs admin company-wide)
- [x] Admin lands on `/admin` after Supabase login (employees → subscriptions)
- [x] Only admins can promote/set admin role in-app
- [x] Password reset (Forgot password → email → `/auth/callback` → `/login/reset`)
- [x] Login / reset “Back to home” link
- [ ] Magic link / OAuth / MFA

**Auth MVP note:** Disable Supabase “Confirm email” so register → immediate login. Password reset requires redirect URL allowlist for `/auth/callback`.

---

## Employee UI

- [x] Subscriptions list (+ empty state)
- [x] Pause / cancel / reactivate on own subscriptions
- [x] Invoices list (+ empty state)
- [x] Upload form (+ custom tool)
- [x] Reimbursement (current month)
- [x] Invoice detail + file viewer + review notes
- [ ] Create / edit own subscription fields beyond status (plan, dates, etc.)

---

## Admin UI

- [x] Dashboard (KPIs, pending queue, employees overview, audit snippet)
- [x] Pending invoice reviews + detail approve/edit/reject
- [x] Employees list + employee detail
- [x] Employee manage form (name, department, role, active)
- [x] Subscription lifecycle actions on employee detail
- [x] Report page + CSV download + mark paid (range or single employee)
- [x] Invoice history filters (pending / approved / rejected / all)
- [x] Report range picker (1 / 2 / 3 months)
- [x] Tool catalog CRUD (`/admin/tools`; delete blocked if referenced)
- [x] Pending-count watcher toast on new uploads / remote reviews
- [ ] Demo store reset UI/API

---

## Internationalization (i18n)

- [x] `next-intl` with locales `bg` (default) and `en`, always-prefixed routes `/bg/…`, `/en/…`
- [x] Root `/` redirects to `/bg`; API routes stay under `/api/*` (no locale prefix)
- [x] Message catalogs `messages/bg.json` + `messages/en.json` (UI, statuses, flags, toasts)
- [x] Locale switcher in app shell, marketing home, and auth shell
- [x] Locale-aware currency (`formatEurForLocale`) and dates/months
- [x] CSV export headers follow `?locale=` from the report page
- [x] Middleware composes next-intl with demo/Supabase auth (locale-stripped path checks)
- [x] `next.config` uses a manual `next-intl/config` alias (avoids `createNextIntlPlugin` → `@swc/core` on hosts with strict SWC native-cache checks)

---

## UX / polish

- [x] Sage primary `rgb(177, 190, 137)` / `#b1be89` theme
- [x] Modern home hero (flow steps + carded register)
- [x] Page transition via `src/app/template.tsx`
- [x] Site footer (typographic SpendFlow credit)
- [x] Parallelize admin employee-overview queries
- [x] Login / reset redesign: two-column `AuthShell`, large full-width Sign in button with spinner, inline friendly errors, "Create one" register link
- [x] Higher-contrast `--brand-deep` (#6b7748) for links and text; sticky blurred header; active nav state + `useLinkStatus` pending bar
- [x] Skeleton loading states (`loading.tsx`) for all admin and employee routes
- [x] `Button` `loading` prop (spinner + disabled) wired into all async actions; step-by-step upload status (upload → AI analysis)
- [x] Faster auth: `cache()`-deduped `getSessionUser`, `getClaims()` (local ES256 JWT verify) in auth + middleware, no role DB query in middleware
- [x] Snappier page transition (150ms) and `prefers-reduced-motion` support
- [x] Keep admin/employee shells mounted across navigations (page `template` under each area, not root) so pending-queue poller does not remount and re-hit auth/DB on every transition

---

## Data & infrastructure

- [x] Next.js App Router + TypeScript + Tailwind + shadcn/ui
- [x] Dual data layer (`demo` ↔ Supabase) in `src/lib/data.ts`
- [x] Initial schema migration (tables, enums, RLS, storage bucket `invoices`, tools seed)
- [x] Auth signup → employee trigger + self-insert policy
- [x] Employees may update own subscription status (RLS)
- [x] Demo seed data (personas, subs, pending invoices)
- [x] Calc unit test (`npm run test:calc`)
- [x] Signed URL helpers for invoice file access (`src/lib/storage.ts`)
- [x] Flag catalog (`src/lib/invoices/flags.ts`)
- [ ] Supabase seed for subscriptions / sample invoices
- [ ] Local Supabase CLI config / automated migrate in CI
- [ ] Broader tests (validate, extract, APIs, RLS, e2e)
- [ ] Storage DELETE policy

---

## Known gaps / quirks

1. **Extraction** — Uses `gemini-3.1-flash-lite` by default. Mock only when no API key. If the key is set and Gemini fails/times out, upload errors instead of inventing fake fields.
2. **USD→EUR** — Fixed company rate `0.8616` (not live FX). Other currencies still use Frankfurter with static fallback. Existing DB rows keep old converted amounts until re-upload/re-review.
3. **Demo vs Supabase upload** — demo may create a pending subscription on upload; Supabase waits until admin approve. File preview / registration / password reset unavailable in demo.
4. **Email confirmation** — must be disabled in Supabase Dashboard for immediate register→login (documented in README). Not configurable from app code.
5. **Middleware deprecation** — Next.js warns that `middleware` should migrate to `proxy`.

---

## Suggested next work (priority)

1. Seed script for sample Supabase data
2. Expand tests beyond calc (validate, flags, FX)
3. Async extraction status polling
4. Middleware → proxy migration
5. OAuth / MFA if needed beyond email/password
