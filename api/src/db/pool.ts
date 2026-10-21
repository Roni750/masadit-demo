import pg from 'pg';
import { config } from '../config.js';
import './pg-types.js';

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  // Supabase's certificate chain isn't in Node's default CA store
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  max: 5,
});
