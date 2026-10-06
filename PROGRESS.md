# SpendFlow progress

Living checklist of what is done vs not. Update this as work lands.

Last reviewed: 2026-10-06

---

## Environment / setup

| Item | Status | Notes |
|---|---|---|
| Local `npm install` + `npm run dev` | Done | Port `43127` |
| `.env.local` with Supabase project | Done | `DEMO_MODE=false`, project `spendflow` |
| Supabase project healthy | Done | Schema migration applied, RLS on |
| Auth users + `employees` rows | Done | Ana (admin), Ivan & Maria (employees) |
| Seeded subscriptions / invoices in Supabase | Not done | DB mostly empty beyond tools + users |
| `GEMINI_API_KEY` for live extraction | Done | Uses `gemini-3.8-flash`; mock when unset / API error |
| Demo mode walkthrough | Done (available) | Set `DEMO_MODE=true` to use in-memory seed |

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
- [x] Deterministic monthly-cost calculation (app code)
- [x] Admin review: approve / edit / reject + audit log
- [x] Monthly reimbursement report + CSV export
- [x] Document AI via Gemini (PDF/image bytes + structured JSON; mock without key)
- [ ] Invoice file preview / download in UI
- [ ] Async extraction with `uploaded` / `extracting` status polling
- [ ] Mark reimbursements as paid
- [ ] Pause / cancel subscription product flows

---

## Auth & access

- [x] Demo auth (cookie + persona picker when `DEMO_MODE=true`)
- [x] Supabase email/password login
- [x] Middleware protection for `/employee` and `/admin`
- [x] Role resolution via `employees.user_id` (`employee` \| `admin`)
- [x] RLS policies in migration (own data vs admin company-wide)
- [ ] Admin lands on admin dashboard after Supabase login (always redirects to employee subscriptions today)
- [ ] Signup / invite / password-reset flows
- [ ] OAuth / magic link / MFA

---

## Employee UI

- [x] Subscriptions list (+ empty state)
- [x] Invoices list (+ empty state)
- [x] Upload form
- [x] Reimbursement (current month)
- [ ] Create / edit own subscription UI (beyond review-driven upsert)
- [ ] File viewer for uploaded invoices

---

## Admin UI

- [x] Dashboard (KPIs, pending queue, employees overview, audit snippet)
- [x] Pending invoice reviews + detail approve/edit/reject
- [x] Employees list + employee detail
- [x] Report page + CSV download
- [ ] Invoice history (approved / rejected / all — pending queue only today)
- [x] Report range picker (1 / 2 / 3 months)
- [ ] Employee / role / tool management CRUD
- [ ] Demo store reset UI/API

---

## Data & infrastructure

- [x] Next.js App Router + TypeScript + Tailwind + shadcn/ui
- [x] Dual data layer (`demo` ↔ Supabase) in `src/lib/data.ts`
- [x] Initial schema migration (tables, enums, RLS, storage bucket `invoices`, tools seed)
- [x] Demo seed data (personas, subs, pending invoices)
- [x] Calc unit test (`npm run test:calc`)
- [ ] Supabase seed for subscriptions / sample invoices
- [ ] Local Supabase CLI config / automated migrate in CI
- [ ] Broader tests (validate, extract, APIs, RLS, e2e)
- [ ] Storage DELETE policy; signed URL helpers for file access

---

## Known gaps / quirks

1. **Extraction quality** — Gemini reads PDF/image bytes; on 503/failure it falls back to mock (`mock_extraction_used` flag, lower confidence). Non-EUR amounts are converted to EUR in app code (Frankfurter/ECB).
2. **Demo vs Supabase upload** — demo may create a pending subscription on upload; Supabase waits until admin approve (employees cannot insert subscriptions under RLS).
3. **Empty company in Supabase** — after wiring Auth users, there is little transactional data until someone uploads/reviews.
4. **Middleware deprecation** — Next.js warns that `middleware` should migrate to `proxy`.

---

## Suggested next work (priority)

1. Seed realistic subscriptions/invoices in Supabase (or a seed script) so admin/employee UIs are not empty.
2. Fix Supabase post-login redirect by role (admin → `/admin`).
3. Invoice file preview on review.
4. Admin invoice history + report month picker.
5. Expand tests beyond calc.
}