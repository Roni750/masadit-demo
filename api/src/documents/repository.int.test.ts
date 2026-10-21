// Integration tests for the closing rules and transactions, against a real Postgres.
// Skipped unless TEST_DATABASE_URL points at a disposable database: they reset all data.
//   docker run -d --rm --name pgtest -e POSTGRES_PASSWORD=test -p 55432:5432 postgres:16-alpine
//   TEST_DATABASE_URL=postgresql://postgres:test@localhost:55432/postgres npm test -w api

import { readdir, readFile } from 'node:fs/promises';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '../db/pg-types.js';
import { createPgDocumentsRepository } from './repository.js';

const url = process.env.TEST_DATABASE_URL;

// Seed ids (db/seed.sql)
const TAX_INVOICE_1000 = 1;
const CREDIT_1000 = 2;
const CREDIT_1001 = 3;
const TAX_INVOICE_1001 = 5;
const TAX_INVOICE_RECEIPT = 6;
const QUOTE_ZERO = 7;
const QUOTE_1001 = 8;

describe.skipIf(!url)('DocumentsRepository (Postgres)', () => {
  const pool = new pg.Pool({ connectionString: url });
  const repo = createPgDocumentsRepository(pool);
  const dbDir = new URL('../../db/', import.meta.url);

  beforeAll(async () => {
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    const migrations = (await readdir(new URL('migrations/', dbDir))).sort();
    for (const file of migrations) {
      await pool.query(await readFile(new URL(`migrations/${file}`, dbDir), 'utf8'));
    }
  });

  beforeEach(async () => {
    await pool.query(await readFile(new URL('seed.sql', dbDir), 'utf8'));
  });

  afterAll(() => pool.end());

  const status = async (id: number) => {
    const document = await repo.findById(id);
    return { status: document?.status, open: document?.open_balance_ils };
  };

  it('closes an invoice with a credit invoice and uses up the credit', async () => {
    const allocation = await repo.allocate(TAX_INVOICE_1000, CREDIT_1000);

    expect(allocation.amount).toBe('11.00');
    expect(await status(TAX_INVOICE_1000)).toEqual({ status: 'closed', open: '0.00' });
    expect(await status(CREDIT_1000)).toEqual({ status: 'closed', open: '0.00' });
  });

  it('removing the allocation reopens both documents', async () => {
    const allocation = await repo.allocate(TAX_INVOICE_1000, CREDIT_1000);

    await repo.removeAllocation(allocation.id);

    expect(await status(TAX_INVOICE_1000)).toEqual({ status: 'open', open: '11.00' });
    expect(await status(CREDIT_1000)).toEqual({ status: 'open', open: '11.00' });
  });

  it('closes manually, including a zero-total quote', async () => {
    await repo.allocate(TAX_INVOICE_1001, null);
    await repo.allocate(QUOTE_ZERO, null);

    expect((await status(TAX_INVOICE_1001)).status).toBe('closed');
    expect((await status(QUOTE_ZERO)).status).toBe('closed');
  });

  it('refuses to close an already closed document', async () => {
    await expect(repo.allocate(TAX_INVOICE_RECEIPT, null)).rejects.toMatchObject({ status: 409, code: 'already_closed' });
  });

  it('refuses a closer type that cannot close the target', async () => {
    await expect(repo.allocate(QUOTE_1001, CREDIT_1000)).rejects.toMatchObject({ status: 409, code: 'invalid_closer' });
  });

  it('refuses a credit invoice whose balance is already used up', async () => {
    await repo.allocate(TAX_INVOICE_1000, CREDIT_1000);

    await expect(repo.allocate(TAX_INVOICE_1001, CREDIT_1000)).rejects.toMatchObject({ status: 409, code: 'no_balance' });
  });

  it('lets two concurrent allocations spend an open balance only once', async () => {
    const results = await Promise.allSettled([
      repo.allocate(TAX_INVOICE_1000, CREDIT_1000),
      repo.allocate(TAX_INVOICE_1000, CREDIT_1001),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(await status(TAX_INVOICE_1000)).toEqual({ status: 'closed', open: '0.00' });
  });

  it('lists candidates and closable documents in both directions', async () => {
    const taxInvoice = (await repo.findById(TAX_INVOICE_1000))!;
    const credit = (await repo.findById(CREDIT_1000))!;

    expect((await repo.closingCandidates(taxInvoice)).map((d) => d.id).sort()).toEqual([2, 3, 4]);
    expect((await repo.closableBy(credit)).map((d) => d.id).sort()).toEqual([TAX_INVOICE_1000, TAX_INVOICE_1001]);

    await repo.allocate(TAX_INVOICE_1000, CREDIT_1000);

    expect((await repo.closingCandidates(taxInvoice)).map((d) => d.id)).not.toContain(CREDIT_1000);
    expect(await repo.closableBy((await repo.findById(CREDIT_1000))!)).toEqual([]);
  });

  it('blocks cancelling or deleting a document with closing links, and allows it without', async () => {
    await repo.allocate(TAX_INVOICE_1000, CREDIT_1000);

    await expect(repo.cancel(TAX_INVOICE_1000)).rejects.toMatchObject({ code: 'has_allocations' });
    await expect(repo.softDelete(CREDIT_1000)).rejects.toMatchObject({ code: 'has_allocations' });

    await repo.cancel(QUOTE_1001);
    expect((await repo.findById(QUOTE_1001))?.cancelled_at).not.toBeNull();
    await repo.softDelete(QUOTE_1001);
    expect(await repo.findById(QUOTE_1001)).toBeNull();
  });
});
