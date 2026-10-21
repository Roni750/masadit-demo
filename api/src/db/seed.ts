import { readFile } from 'node:fs/promises';
import { pool } from './pool.js';

// Resets all demo data to the seed in one transaction
const seed = async () => {
  const sql = await readFile(new URL('../../db/seed.sql', import.meta.url), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('seeded demo data');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

await seed();
