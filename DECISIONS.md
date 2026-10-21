# Decisions

A log of the architecture and product decisions behind this project, and the reasoning for each.
Newest decisions are added at the bottom.

---

## 1. Real routes instead of single-URL screen swapping

**Context:** The legacy app renders every screen under one URL and swaps the content in place. The only way back is an in-app button, there is no browser history, and there are no deep links.

**Decision:** Use real routes through Ionic's router integration.

**Why:** Single-URL navigation is not a PWA or Cordova constraint. Real routes give a navigation stack with native page transitions, iOS swipe-back, a working Android back button, browser history on the web, and deep links (e.g. a notification opening a specific document). The same routes work on the web, as a PWA, and inside the native shell.

**Consequences:** The web host needs an SPA fallback, so that refreshing a deep link serves `index.html`.

---

## 2. Scope: everything within 3 taps of History

**Context:** The assignment requires a UI replica of the homepage and a functional History page. History entries lead deeper into the app: document detail, status, client profile.

**Decision:** Implement everything up to 3 taps from History, where tap 1 opens an entry. Stop where a feature starts depending on entities that aren't built. Examples are document creation forms, PDF outputs (English version, true copy) and the payment page.

**Why:** Clear, explainable boundaries. Building half of an entity that depends on unbuilt entities would produce fake depth.

**Consequences:** Out-of-scope actions stay in the layout and remain tappable. Tapping one shows an alert saying the feature is a work in progress.

---

## 3. Skeleton loaders instead of blocking spinners

**Context:** The legacy app shows a modal "please wait" spinner on every navigation and every filter tap, blocking the whole screen.

**Decision:** Show skeleton placeholders shaped like the content, and only when there is no cached data to show.

**Why:** Content-shaped placeholders feel faster and don't block interaction. Combined with caching (decision 4), most navigations show no loading state at all.

---

## 4. Server state in TanStack Query, with invalidation on the user's own writes

**Context:** In the legacy app every filter tap triggers a fresh load with a blocking spinner, including going back to a filter that was just shown.

**Decision:**
- Server data (history lists, per-type totals, documents, clients) is managed by TanStack Query.
- Each filter criterion has an ID, and it's part of the query key, e.g. `['documents', criteriaId, page]`.
- Fetching starts on touch-down of a filter, before the tap completes.
- `staleTime` ≈ 30s for lists and totals. Data is always shown from cache instantly, and refetched in the background once stale.
- **Every write the user makes** (manual close, allocation, delete, cancel, client edit) **invalidates the affected queries as soon as it succeeds.**
- Stale queries refetch when the app returns to the foreground.
- `gcTime` stays at the 5-minute default.

**Why:** Consistency over availability for financial data. A document the user just closed must never appear "open" because a TTL hasn't expired. The user's own writes are the most common cause of stale data, so invalidating on write handles them precisely. The short `staleTime` covers changes made elsewhere (another device, an accountant) without bringing back loading screens.

**Consequences:** Each mutation must declare which query keys it affects. Offline persistence of the cache is deliberately left out for now.

---

## 5. Jotai for small client-side state

**Context:** Small client state (language, text direction, user preferences) doesn't belong in the server-state cache.

**Decision:** Jotai.

**Why:** Lightweight, atom-based, and actively maintained. Recoil, which has the same atom model, was considered and rejected: Meta archived it in 2025. Adopting an unmaintained library would repeat the problem this migration is meant to solve.

---

## 6. Frontend-first migration, without modelling the legacy data in depth first

**Context:** The migration target is the frontend: Cordova + an old Angular version, built into the Android, iOS and web apps. The backend isn't being replaced.

**Decision:** Start migrating screens without first reverse-engineering the full legacy data model. The new frontend is built against an API contract that covers only what each migrated screen needs, and the contract grows screen by screen.

**Why:** Requiring a complete model of a legacy system before any migration work begins stalls the migration. Each screen only needs the slice of data it shows and changes.

**Consequences:** In a real development environment, correctness is checked by parity tests that pass against both the legacy app and the new one. In this assignment, a mock API stands in for the real backend.

---

## 7. One repository; web app on Netlify, mock API on Render, data in Postgres

**Context:** The reviewer receives a single repository URL and runs it locally. A public URL is also wanted. Netlify serves static files and serverless functions, but it can't run a long-running Node server.

**Decision:**
- A single repository using npm workspaces: `web/` for the Ionic app and `api/` for the mock API.
- The web build deploys to Netlify (`netlify.toml`).
- The Node.js (Express) mock API deploys to Render (`render.yaml`).
- The mock API's data lives in a free hosted Postgres database on Supabase. Local development connects to the same
  remote database; there is no local database instance.

**Why:** Backend depth isn't the focus of the assignment (see decision 6). One repo means one clone, one `npm install` and one `npm run dev` for the reviewer. A real database means changes the user makes (closing a document, editing a client) survive API restarts and Render's free-tier sleep.

**Consequences:** Render's free tier sleeps after inactivity, so the first request after a sleep is slow. Native builds need an absolute API URL (`VITE_API_URL`), and the API allows CORS from the web origin and the Capacitor app origins.

---

## 8. An adapter layer between the API and the UI

**Context:** The new frontend will eventually talk to the company's real backend, whose schemas aren't known yet (see decision 6).

**Decision:** API responses pass through a mapping layer in the data service before reaching the rest of the app. Components and query hooks only see the app's own types, never raw API shapes.

**Why:** When the real API arrives, only the mapping functions change; pages and components don't. This seam is what makes migrating without a full data model up front (decision 6) safe.

---

## 9. Mock schema: a table per document type, on a shared base table

**Context:** The app issues about ten document types (quote, order, tax invoice, tax invoice/receipt, credit invoice, receipt, delivery note…). They share most fields, and some have their own. Line items, payments and allocations (one document closing another, often across types) must reference any document.

**Decision:**
- A table per document type, each extending a shared `documents` base table (class table inheritance).
- Shared columns (number, client, date, currency, VAT rate) live in the base table. Type-specific columns live in the type's table.
- Lines, payments and allocations reference the base table with real foreign keys.
- Totals and open/closed status are derived in a view from lines and allocations; they're never stored.
- Money is stored as exact decimals.
- The VAT rate is stored on each document.

**Why:** Allocations cross document types, and an orphaned allocation would silently change an invoice's balance and status. A plain `(type, id)` reference can't be checked by the database, and child tables per type can't express cross-type closing. The base table gives database-enforced integrity at the cost of one join.

**Consequences:** This schema belongs to the mock backend only. In the real migration the backend and its schemas stay as they are; the frontend adapts to them through the adapter layer (decision 8), so this choice doesn't carry over.

---

## 10. Screens load on demand, and are preloaded before they're needed

**Context:** All screens shipped in one bundle that had to download and parse before Home appeared.

**Decision:** Every screen except Home is code-split with dynamic `import()` (`React.lazy`), each in its own chunk. Chunks are preloaded so navigation doesn't wait for them:
- Home preloads History once the app is idle.
- Touching a card, status pill or link starts loading the screen the tap will open, the same touch-down prefetch used for data (decision 4).

A page-shaped skeleton covers the rare case where a chunk hasn't arrived yet, so Ionic's page transition still animates a page.

**Why:** Less code to download and parse before the first screen, with no added wait on the first visit to each screen.

**Consequences:** Measured: each screen is now 1–3 KB gzipped, but the first load only dropped from ~359 KB to ~338 KB gzipped. Most of the weight is shared library code (Ionic, React, i18n, TanStack Query) that Home needs too. On native builds the files are local, so the gain is parse time rather than download time.
