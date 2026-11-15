# Home Expenses & Investments

A self-hosted household finance app: import monthly credit-card files, manage
shared expense/investment categories, set budgets, track yearly goals, record
investments, and view a year-over-year summary. Bilingual (Hebrew RTL / English
LTR), ₪, built for personal household use.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS v4** — design tokens in `tailwind.config.ts` ("Plum & Linen" palette), runtime CSS variables + light/dark in `app/globals.css`
- **Prisma 6** + **PostgreSQL**
- **Auth.js (NextAuth v5)** — per-user accounts, credentials login
- shadcn-style UI primitives (`components/ui`) + shared library (`components/shared`)

## Getting started

```bash
# 1. Start Postgres (Docker)
npm run db:up

# 2. Install deps
npm install

# 3. Apply the schema
npm run db:migrate

# 4. Migrate your existing spreadsheet (categories, 2022–2026 transactions,
#    budgets, investments, goals) — idempotent, safe to re-run
npm run seed            # reads ./expenses_and_investments.xlsx

# 5. Create your household accounts
npm run create-user you@example.com "Your Name" "a-password" he
npm run create-user spouse@example.com "Spouse" "a-password" he

# 6. Run it
npm run dev             # http://localhost:3000
```

Environment variables live in `.env` (see `.env.example`): `DATABASE_URL`,
`AUTH_SECRET` (generate with `openssl rand -base64 32`), `AUTH_TRUST_HOST`.

## Features

| Area | Where |
|------|-------|
| Summary / dashboard (spend by category, YoY ₪/% toggle, investment change) | `/dashboard` |
| Expenses list + manual CRUD | `/transactions` |
| Credit-card import (Max / Isracard / Cal / generic, learns business→category) | `/import` |
| Categories CRUD (shared expense/investment type) | `/categories` |
| Monthly budgets (yearly auto-calculated) | `/budgets` |
| Yearly goals (numeric + checklist) | `/goals` |
| Investments (portfolios, holdings, deposits, returns) | `/investments` |

## Key code

- `prisma/schema.prisma` — data model
- `prisma/seed.ts` — spreadsheet migration
- `lib/importers/` — credit-card file parsing + column detection
- `lib/summary.ts` — YoY + investment aggregation
- `app/actions/` — server actions per feature
- `components/ui` / `components/shared` — design system; screens compose only from these

## Deploy

Deployable to any Node host (Fly, Railway, Vercel + hosted Postgres). Set the
env vars, run `prisma migrate deploy`, then `npm run build && npm start`.
