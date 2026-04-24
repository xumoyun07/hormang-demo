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
- `/provider-reviews` — Provider review inbox with customer review cards, photo previews, and customer profile preview modal

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
- `matching.ts` — centralized category + location matching helpers (`doesCategoryMatch`, `doesLocationMatch`, `doesRequestMatch`); used by `provider-store.ts`

**Category + Location Matching:**
- `CustomerRequest` stores `region?`/`district?` (extracted from questionnaire answers or passed explicitly)
- `LocalProfile` stores `serviceAreas?: string[]` (multi-select in provider settings)
- `getMatchingRequests(categories, serviceAreas)` filters by both category AND location
- Legacy profiles: if `serviceAreas` empty but `region` set, auto-seeds `serviceAreas=[region]`
- Requests without region match all providers (backward compat for legacy requests)
- Questionnaire adds region as a required common question; district shown only when "Toshkent shahri" selected

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

## Offer Preview / Review System

**ProviderRequest type** (`provider-store.ts`): now includes `answers`, `customerId`, `region`, `district` fields. `adaptBuyerRequest` populates all of these from `CustomerRequest`.

**Offer Form** (`components/offer-form.tsx`):
- Displays questionnaire Q&A pairs using `getAllQuestionsForCategory(categoryId)` + `request.answers`
- Removed manual "avg response time" editor (was editable; now auto-populated)
- Added "Mijoz profilini ko'rish" button → opens `CustomerProfileModal` (shows name, location, category, budget — no phone)
- On submit: calls `saveOffer(data, providerMeta)` which syncs to both `hormang_provider_offers` AND `hormang_offers` (customer side)
- Provider identity taken from `useAuth().user` at submit time

**Shared Offer Detail Modal** (`components/offer-detail-modal.tsx`):
- `OfferDetailModal`: customer-side read-only view of a received offer. Two sections: "Ijrochi taklifi" (price/time grid, message, files, date) + "Mijoz so'rovi" (full Q&A from questionnaire). Footer has "Chat ochish" + Accept/Reject actions.
- `ProviderProfileModal`: moved here from `offers.tsx`. Shows provider photo (`getLocalProfile(masterId)`), avg response time, service areas, portfolio. Opened via "Ijrochi profilini ko'rish" button inside `OfferDetailModal`.
- Both exported for use in `offers.tsx` and `chat-offers.tsx`.

**Offers Page** (`pages/offers.tsx`) & **Chat-Offers Page** (`pages/chat-offers.tsx`):
- Offer cards are fully clickable → opens `OfferDetailModal`
- "Chat ochish" button renamed to "Batafsil" → also opens `OfferDetailModal`
- Accept/Reject buttons on card use `e.stopPropagation()` so they don't trigger the modal
- "Qaytarish" (restore rejected offer) still works via direct localStorage mutation

**Offer sync flow:**
- Provider fills offer form → `saveOffer` in `provider-store` writes to `hormang_provider_offers` AND `hormang_offers`
- Customer sees offers in `/offers` page from `hormang_offers`
- offerCount on `CustomerRequest` is incremented in `hormang_requests` on each offer

## Tanga Transaction History System

### Transaction Store (`lib/tanga-history-store.ts`)
- Key: `hormang_tanga_history` in localStorage
- Interface: `TangaTransaction { id, userId, offerId, requestId, categoryName, categoryEmoji, description, amount, createdAt }`
- Functions: `recordTangaTransaction()`, `getTangaTransactions(userId)`, `getAllTangaTransactions()`, `getTransactionByOfferId(offerId)`
- Called from `offer-form.tsx` on successful offer submission (after `spendTangaBalance`)

### Provider History Page — `/provider/tanga-history`
- File: `artifacts/hormang-landing/src/pages/provider/tanga-history.tsx`
- Shows current balance (violet hero card), total spent, average cost per offer
- Lists all transactions: category emoji + name, date/time, Tanga amount, "Batafsil" button
- "Batafsil" opens `OfferDetailModal` with the linked offer
- Accessible from Plans page via "🧾 Tanga sarflash tarixini ko'rish →" link
- Empty state with CTA → `/provider/requests`

### Offer Detail Modal — Transaction section
- `OfferDetailModal` now shows "Tranzaksiya ma'lumotlari" section at bottom when a linked transaction exists
- Looks up transaction via `getTransactionByOfferId(offer.id)`
- Shows: coin icon, amount (−X Tanga), date + time, transaction ID

## Offer Completion Flow

### Completion Store (`lib/completion-store.ts`)
- Keys: `hormang_reviews_v2` (Review[]), `hormang_completed_{role}_{userId}` (number)
- `Review` interface stores reviewer/reviewed IDs + roles, request/offer linkage, rating, comment, optional review photo, optional Hormang platform feedback, createdAt, and service category
- Exported: `getReviewsForUser(userId, role)`, `getAverageRatingForUser(userId, role)`, `hasReviewedRequest(requestId, reviewerId)`, `addReview(review)`, `getCompletedCount(userId, role)`, `incrementCompletedCount(userId, role)`
- Review modal supports compressed photo upload plus "Hormang haqida fikringiz" thumbs up/down and textarea fields
- Customer → provider reviews include three 0–100% provider metrics: `serviceQuality`, `providerAttitude`, `servicePrice`; individual values are stored on each review and provider-level running averages are persisted at `hormang_provider_review_averages_{providerId}` using `(old_average + new_value) / 2`

### Offer Status Extensions
- `Offer.status` now includes: `"pending" | "accepted" | "rejected" | "in_progress" | "completed"`
- New requests-store functions: `getOfferById(id)`, `markOfferInProgress(offerId)`, `markOfferCompleted(offerId)` (returns bool; also increments both customer + provider completed counts, sends system message, updates request status)

### UpcomingService Extensions
- Fields added: `offerId?`, `requestId?`, `masterId?`, `customerId?`
- New provider-store function: `addUpcomingService(...)` — also calls `markOfferInProgress` if offerId is present

### Review Modal (`components/review-modal.tsx`)
- Shared bottom-sheet: 5-star picker + optional text + submit/skip
- Used on both customer (rate provider) and provider (rate customer) sides after completion

### Customer Chat (`pages/chat.tsx`)
- "Tugatildi" emerald button appears in header when offer is `accepted` or `in_progress`
- On click: `markOfferCompleted` → shows `ReviewModal` for the provider
- Offer status badge now handles `in_progress` (spinning loader) and `completed` (flag icon)

### Customer Request History
- Completed customer requests move out of `/my-requests` and are shown in `/request-history`
- `dashboard/index.tsx` buyer menu item "Buyurtmalarim" navigates to `/request-history`
- `/my-requests` now shows only active (`open`) and cancelled requests; completed requests remain viewable in history with detail/offers/chat access

### Provider Profile Completion
- Completion checks now use locally saved provider `categories` and `bio` as fallback when the API profile returns empty after logout/login
- 100% completion cards in `/dashboard` and `/provider-home` can be dismissed with an upper-right X per user
- Provider role access now also uses a per-user local provider marker plus saved service categories as fallback, keeping the dashboard role switcher after logout/login when the server profile is sparse

### Provider Chat (`pages/provider/chats.tsx`)
- "Tugatildi" green button in header when offer is `accepted` or `in_progress`
- "+" dashed button left of input (when accepted/in_progress) → opens `ScheduleModal`
- `ScheduleModal`: date picker, time, location inputs → `addUpcomingService()` + system message in chat
- After completion → `ReviewModal` for the customer
- System messages use `sendSystemMessage` from requests-store

### Provider Home (`pages/provider/home.tsx`)
- Upcoming service cards are now clickable → opens `OfferDetailModal` (read-only)
- Checkmark button triggers completion flow: `markOfferCompleted` → `ReviewModal` → `markServiceDone`

### Real Metrics
- `public-profile-preview-modal.tsx`: provider + customer metrics rows now show real `avgRating`, `reviewCount`, `completedCount` from completion-store
- `dashboard/index.tsx` (provider view): real star rating + completed count from completion-store

### Media Upload System
- **Shared component**: `components/media-upload.tsx` — `MediaUploadZone` (multi-photo, drag/drop, reorder, remove, counter) and `CompactMediaUpload` (compact variant for offer form)
- **Request photos**: `CustomerRequest` has `requestPhotos?: string[]`; `SummaryScreen` in questionnaire allows up to 10 photos; shown in `image-grid.tsx` via `getAnswerImageUrls(answers, requestPhotos?)`
- **Offer photos**: `offer-form.tsx` uses `CompactMediaUpload` (max 3 photos); stored as `fileUrls` in the offer
- **Portfolio albums**: `LocalProfile` has `albums?: PortfolioAlbum[]` (up to 10 albums × 20 photos each); `settings.tsx` has accordion album management UI with `MediaUploadZone` per album; old flat `portfolioItems` migrated automatically to a single "Ishlarim" album on read
- **Public profiles**: `public-profile-modal.tsx` and `public-profile-preview-modal.tsx` both show albums using `ImageGrid` (per-album accordion with photo count and built-in lightbox)
- **Chat attachments**: Both `chat.tsx` (customer) and `provider/chats.tsx` (provider) have an image icon button next to the input bar; selected image is compressed (800px, q=0.72), shown as a preview thumbnail, and sent with the message; image bubbles render inline above the message text; `sendMessage` and `sendProviderMessage` both accept an optional `ChatAttachment`
- **Image compression**: `image-utils.ts` — `compressImage(file, maxDim, quality)` used throughout (maxDim 800–1024, quality 0.70–0.80); base64 stored in localStorage

## Admin Panels

### Main Admin Dashboard — `/admin`
- **Credentials:** username `hormangVIP`, password `ourhormang123`
- Session stored in `sessionStorage` (re-login on refresh)
- Sections: Overview (metrics + Recharts), So'rovlar (requests), Takliflar (offers), Foydalanuvchilar (users), Monetizatsiya (pricing tiers), Audit log
- Reads live data from: `hormang_requests`, `hormang_offers`, `hormang_provider_offers`, `hormang_provider_chats`
- All admin actions written to `hormang_admin_log` localStorage key
- Pricing tiers persisted in `hormang_pricing_tiers`
- File: `artifacts/hormang-landing/src/pages/admin/index.tsx`
- **Monetization sub-tabs:** "Narx Rejalari" (existing) + "🪙 Token Tarixi" (global Tanga transactions)
  - Token Tarixi: summary stats (today/month/all-time), filter by date/search, table with Batafsil button → OfferDetailModal
- **Users table:** New "Tanga 🪙" column shows balance + clickable "N tranzaksiya" link
  - Opens `AdminUserTxModal`: per-user transactions slide-up sheet with balance stats + Batafsil per row

### Category/Question Manager — `/admin/questions`
- **Password:** `hormang2024` (old panel, still active)
- Manages per-category questionnaire flows
- File: `artifacts/hormang-landing/src/pages/admin/questions.tsx`

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
