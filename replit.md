# Hormang — Local Services Marketplace (Uzbekistan)

## Project Goal

Connecting buyers with verified local service providers (plumbers, cleaners, nannies, tutors, etc.) via AI-powered search, full auth/profile system, and dual-role switching between buyer and provider modes within the same account.

## Workspace Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `artifacts/hormang-landing` (`@workspace/hormang-landing`)

React + Vite frontend for the Hormang marketplace. Served on port 5173 via the "Start application" workflow.

**Key pages:**
- `/` — Landing page with AI search hero, categories, how-it-works, social proof
- `/auth/role-select` — Choose buyer vs provider registration path
- `/auth/register` — Multi-step phone+OTP registration (name → phone → OTP → [provider profile])
- `/auth/login` — Phone-only 2-step login (phone → OTP code)
- `/auth/migrate` — Legacy migration page: email+password → add phone → OTP verify
- `/dashboard` — Unified dashboard (also at `/dashboard/buyer`, `/dashboard/provider`)
- `/profile/settings` — Account (name), Contact info (optional email), provider profile sections
- `/providers/:id` — Public provider profile page

**Provider (Ijrochi) Pages:**
- `/provider-home` — Provider home with profile completion, upcoming services, events placeholder, available requests (slide cards + tabbed list), share profile
- `/provider/requests` — So'rovlar: unseen badge, fullscreen slide modal (swipe left/right), category filter chips, respond/ignore actions
- `/provider/chats` — Suhbatlarim: search bar, tabs (All | Unread | By service), chat rows with unread badges, inline chat view

**Role-Based Navigation:**
- `BottomNav` detects `activeRole` from auth context and switches between buyer tabs and provider tabs
- **Buyer tabs**: Bosh sahifa(/), Kategoriyalar, So'rovlarim, Suhbatlarim, Profil
- **Provider tabs**: Bosh sahifa(/provider-home), So'rovlar, Smart-Hormang (disabled—shows toast), Suhbatlarim, Profil
- Badges: buyer gets offer count on Suhbatlarim; provider gets unseen request count on So'rovlar + unread count on Suhbatlarim
- `provider-store.ts` — mock data store with 7 requests, 3 upcoming services, 3 chats; seeded once to localStorage

**Auth System (Phone+OTP, no email/password):**
- Primary auth: phone number + 6-digit SMS OTP (simulated in dev, `devCode` returned in API response)
- No passwords for new users; random hash stored (never used for auth)
- `POST /api/auth/sms/send` — sends OTP; `purpose` = "register" | "login" | "migrate" | "add-phone"
- `POST /api/auth/register` — `{firstName, lastName, phone, otp, role}`
- `POST /api/auth/login` — `{phone, otp}` — OTP-based passwordless login
- `POST /api/auth/migrate-account` — legacy path: `{email, password, phone, otp}` → migrates email user to phone
- `PUT /api/auth/add-phone` — add phone to existing logged-in account (requires auth)
- `PUT /api/auth/profile` — update name + optional email (phone not updatable via this endpoint)
- Email is purely optional, stored without verification, available in profile settings "Kontakt ma'lumotlari" section
- Migration banner shown in profile settings when `user.phone === null`

**Auth context (`src/contexts/auth-context.tsx`):**
- `user` — authenticated SafeUser or null
- `providerProfile` — ProviderProfile or null (any user can hold one)
- `activeRole` — "buyer" | "provider", persisted in `localStorage` at `hormang_active_role`
- `switchRole()` — toggle active role; triggers setup modal on first provider switch
- `setAuth(user, profile?)` — update both user and provider profile
- `setProviderProfile(profile)` — update provider profile only
- `loading` — auth init state

**Dual-role system:** Any registered user can switch to provider mode. First switch opens a setup modal to create a provider profile. Role switch is instant (no API call), with animated pill toggle (blue=buyer, violet=provider) in the dashboard header.

**Token storage:** Access token at `hormang_access_token` in localStorage; refresh token in HttpOnly cookie.

**Design system:** Plus Jakarta Sans, `#2563EB` blue (buyer), `hsl(262,80%,54%)` violet (provider), `--brand-gradient` CSS var, `.card-shadow` / `.pill-label` / `.text-gradient` / `.hero-bg` utilities.

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
