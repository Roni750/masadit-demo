# MyBiz: Ionic rebuild

A rebuild of the MyBiz bookkeeping app's Home and History screens in **Ionic + React + TypeScript**. One codebase ships as a web app / PWA and as native Android and iOS apps (Capacitor). Hebrew, English and Spanish are supported, with right-to-left and left-to-right layouts.

- **Home**: a UI replica. History is the only working button; every other action shows a "work in progress" alert.
- **History** (functional, plus everything within 3 taps of it):
  - a document feed with search, per-type totals and type filtering
  - document details
  - status: closing documents against each other, or manually
  - closing other documents
  - cancel and delete
  - the client card: details, the client's documents, the bookkeeping ledger, and editing
  - Excel export (plain, or detailed with due dates and recipients)

Architecture decisions and the reasoning behind them are in **[DECISIONS.md](DECISIONS.md)**.

## Repository layout

```
web/   Ionic React app (Vite, Capacitor) – deployed to Netlify
api/   Mock bookkeeping API (Express, Postgres on Supabase) – deployed to Render
```

Inside `web/src`:
- `domain/`: the app's own types
- `api/`: the adapter layer that maps API shapes to and from those types
- `features/`: screens
- `i18n/`: translations

## Run locally

Requires Node 22.

```bash
npm install
cp api/.env.example api/.env   # then paste the DATABASE_URL you were given
npm run dev                    # API on http://localhost:3001, app on http://localhost:8100
```

Open http://localhost:8100. To reset the demo data at any time, run `npm run db:seed -w api`.

## Tests

```bash
npm test                       # web unit tests
npm test -w api                # API route tests
npm run test.e2e -w web        # Cypress end-to-end (needs `npm run dev`; resets the demo data)
```

The API's Postgres integration tests run when `TEST_DATABASE_URL` points to a disposable database. See the header of `api/src/documents/repository.int.test.ts` for a one-line Docker command.

## Android / iOS

```bash
npm run build -w web
cd web
npx cap add android            # once; creates the native project (use `ios` on macOS)
npx cap sync
npx cap open android           # opens Android Studio to run on a device or emulator
```

Set `VITE_API_URL` to the deployed API's URL before building. The phone can't reach `localhost` on your computer.

## Deployment

- **Web (Netlify):** configured by `netlify.toml`. Set the `VITE_API_URL` environment variable to the API's URL.
- **API (Render):** configured by `render.yaml`. Set `DATABASE_URL` (Supabase session pooler) and `CORS_ORIGINS` (the Netlify site URL).
- **Database:** `npm run db:migrate -w api`, then `npm run db:seed -w api`.
