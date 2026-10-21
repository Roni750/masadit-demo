import { existsSync } from 'node:fs';

// Local development reads api/.env; on Render the variables come from the dashboard
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const DEFAULT_ORIGINS = [
  // Vite dev server (web/vite.config.ts)
  'http://localhost:8100',
  // Capacitor WebView origins (Android, iOS)
  'https://localhost',
  'capacitor://localhost',
];

const extraOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const config = {
  port: Number(process.env.PORT ?? 3001),
  corsOrigins: [...DEFAULT_ORIGINS, ...extraOrigins],
  databaseUrl: process.env.DATABASE_URL,
  // Supabase requires TLS; set DATABASE_SSL=false only for a plain local Postgres
  databaseSsl: process.env.DATABASE_SSL !== 'false',
};
