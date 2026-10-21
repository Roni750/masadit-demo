import type pg from 'pg';
import { conflict, notFound } from '../http/errors.js';
import { canClose, CLOSING_TYPES, closableTypes, CONSUMING_CLOSER_TYPES } from './closing-rules.js';
import type {
  AllocationRow,
  DocumentDetailRow,
  DocumentLineRow,
  DocumentListFilter,
  DocumentSummaryRow,
  Page,
  PaymentRow,
  TypeTotalRow,
} from './types.js';

export interface DocumentsRepository {
  list(filter: DocumentListFilter, page: number, pageSize: number): Promise<Page<DocumentSummaryRow>>;
  typeTotals(filter: Omit<DocumentListFilter, 'type'>): Promise<TypeTotalRow[]>;
  findById(id: number): Promise<DocumentDetailRow | null>;
  // Documents of the same client that could still close the target
  closingCandidates(target: DocumentSummaryRow): Promise<DocumentSummaryRow[]>;
  // Documents of the same client that the closer could still close
  closableBy(closer: DocumentSummaryRow): Promise<DocumentSummaryRow[]>;
  // closingId null means a manual close. Throws HttpError (404/409) when not allowed.
  allocate(targetId: number, closingId: number | null): Promise<AllocationRow>;
  removeAllocation(id: number): Promise<void>;
  cancel(id: number): Promise<void>;
  softDelete(id: number): Promise<void>;
}

const SUMMARY_SELECT = `
  SELECT s.*, c.name AS client_name, c.email AS client_email, c.payment_terms AS client_payment_terms,
         ci.credited_document_id,
         credited.number AS credited_document_number,
         credited.type AS credited_document_type
  FROM document_summaries s
  JOIN clients c ON c.id = s.client_id
  LEFT JOIN credit_invoices ci ON ci.id = s.id
  LEFT JOIN documents credited ON credited.id = ci.credited_document_id
`;

const ALLOCATION_SELECT = `
  SELECT a.id,
         a.target_document_id, target.type AS target_document_type, target.number AS target_document_number,
         a.closing_document_id, closer.type AS closing_document_type, closer.number AS closing_document_number,
         a.amount, a.created_at
  FROM allocations a
  JOIN documents target ON target.id = a.target_document_id
  LEFT JOIN documents closer ON closer.id = a.closing_document_id
`;

// Builds a parameterized WHERE clause; values never get interpolated into SQL
const buildWhere = (filter: DocumentListFilter) => {
  const conditions: string[] = [];
  const values: unknown[] = [];
  // `toCondition` receives the placeholder ($1, $2, …) assigned to `value`
  const add = (value: unknown, toCondition: (param: string) => string) => {
    values.push(value);
    conditions.push(toCondition(`$${values.length}`));
  };

  if (filter.type) add(filter.type, (p) => `s.type = ${p}`);
  if (filter.status) add(filter.status, (p) => `s.status = ${p}`);
  if (filter.clientId) add(filter.clientId, (p) => `s.client_id = ${p}`);
  if (filter.search) {
    add(filter.search, (p) => `(c.name ILIKE '%' || ${p} || '%' OR s.number::text LIKE '%' || ${p} || '%')`);
  }

  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', values };
};

const toCents = (amount: string) => Math.round(Number(amount) * 100);
const fromCents = (cents: number) => (cents / 100).toFixed(2);

const hasAllocations = async (db: pg.PoolClient, id: number) => {
  const { rowCount } = await db.query(
    'SELECT 1 FROM allocations WHERE target_document_id = $1 OR closing_document_id = $1 LIMIT 1',
    [id],
  );
  return (rowCount ?? 0) > 0;
};

// Runs `work` in a transaction, rolling back if it throws
const inTransaction = async <T>(db: pg.Pool, work: (client: pg.PoolClient) => Promise<T>) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const createPgDocumentsRepository = (db: pg.Pool): DocumentsRepository => {
  const findSummary = async (client: pg.Pool | pg.PoolClient, id: number) => {
    const { rows } = await client.query<DocumentSummaryRow>(`${SUMMARY_SELECT} WHERE s.id = $1`, [id]);
    return rows[0] ?? null;
  };

  return {
    async list(filter, page, pageSize) {
      const { where, values } = buildWhere(filter);
      const [items, count] = await Promise.all([
        db.query<DocumentSummaryRow>(
          `${SUMMARY_SELECT} ${where}
           ORDER BY s.issued_at DESC, s.id DESC
           LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
          [...values, pageSize, (page - 1) * pageSize],
        ),
        db.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM document_summaries s JOIN clients c ON c.id = s.client_id ${where}`,
          values,
        ),
      ]);
      return { items: items.rows, page, page_size: pageSize, total_items: count.rows[0].count };
    },

    async typeTotals(filter) {
      const { where, values } = buildWhere(filter);
      const { rows } = await db.query<TypeTotalRow>(
        `SELECT s.type, COUNT(*)::int AS count, SUM(s.total_ils)::numeric(12, 2) AS total_ils
         FROM document_summaries s JOIN clients c ON c.id = s.client_id
         ${where}
         GROUP BY s.type
         ORDER BY s.type`,
        values,
      );
      return rows;
    },

    async findById(id) {
      const summary = await findSummary(db, id);
      if (!summary) return null;

      const [lines, payments, allocations] = await Promise.all([
        db.query<DocumentLineRow>(
          'SELECT id, position, description, quantity, unit_price, vat_exempt FROM document_lines WHERE document_id = $1 ORDER BY position',
          [id],
        ),
        db.query<PaymentRow>('SELECT id, method, paid_at, amount FROM payments WHERE document_id = $1 ORDER BY paid_at', [id]),
        db.query<AllocationRow>(
          `${ALLOCATION_SELECT}
           WHERE a.target_document_id = $1 OR a.closing_document_id = $1
           ORDER BY a.created_at`,
          [id],
        ),
      ]);

      return { ...summary, lines: lines.rows, payments: payments.rows, allocations: allocations.rows };
    },

    async closingCandidates(target) {
      const closingTypes = CLOSING_TYPES[target.type];
      if (closingTypes.length === 0) return [];

      const { rows } = await db.query<DocumentSummaryRow>(
        `${SUMMARY_SELECT}
         WHERE s.client_id = $1 AND s.id <> $2 AND s.cancelled_at IS NULL
           AND s.type = ANY($3::document_type[])
           -- Consuming closers need balance left; converting closers don't
           AND (s.type <> ALL($4::document_type[]) OR s.status = 'open')
           AND NOT EXISTS (
             SELECT 1 FROM allocations a WHERE a.target_document_id = $2 AND a.closing_document_id = s.id
           )
         ORDER BY s.issued_at DESC, s.id DESC`,
        [target.client_id, target.id, closingTypes, CONSUMING_CLOSER_TYPES],
      );
      return rows;
    },

    async closableBy(closer) {
      const targetTypes = closableTypes(closer.type);
      const consuming = CONSUMING_CLOSER_TYPES.includes(closer.type);
      if (targetTypes.length === 0 || closer.cancelled_at || (consuming && closer.status === 'closed')) return [];

      const { rows } = await db.query<DocumentSummaryRow>(
        `${SUMMARY_SELECT}
         WHERE s.client_id = $1 AND s.id <> $2 AND s.cancelled_at IS NULL AND s.status = 'open'
           AND s.type = ANY($3::document_type[])
           AND NOT EXISTS (
             SELECT 1 FROM allocations a WHERE a.target_document_id = s.id AND a.closing_document_id = $2
           )
         ORDER BY s.issued_at DESC, s.id DESC`,
        [closer.client_id, closer.id, targetTypes],
      );
      return rows;
    },

    allocate(targetId, closingId) {
      return inTransaction(db, async (client) => {
        // Lock both documents so two concurrent allocations can't both spend the same open balance
        await client.query('SELECT id FROM documents WHERE id = ANY($1::bigint[]) ORDER BY id FOR UPDATE', [
          [targetId, closingId].filter((id) => id !== null),
        ]);

        const target = await findSummary(client, targetId);
        if (!target) throw notFound(`Document ${targetId} not found`);
        if (target.cancelled_at) throw conflict('document_cancelled', 'A cancelled document cannot be closed');
        if (target.status === 'closed') throw conflict('already_closed', 'The document is already closed');

        let amountCents = toCents(target.open_balance_ils);

        if (closingId !== null) {
          const closer = await findSummary(client, closingId);
          if (!closer) throw notFound(`Document ${closingId} not found`);
          if (closer.id === target.id) throw conflict('invalid_closer', 'A document cannot close itself');
          if (closer.client_id !== target.client_id) {
            throw conflict('invalid_closer', 'The closing document belongs to another client');
          }
          if (!canClose(closer.type, target.type)) {
            throw conflict('invalid_closer', `A ${closer.type} cannot close a ${target.type}`);
          }
          if (closer.cancelled_at) throw conflict('document_cancelled', 'A cancelled document cannot close another');
          if (CONSUMING_CLOSER_TYPES.includes(closer.type)) {
            amountCents = Math.min(amountCents, toCents(closer.open_balance_ils));
            if (amountCents === 0) throw conflict('no_balance', 'The closing document has no balance left');
          }
          const existing = await client.query(
            'SELECT 1 FROM allocations WHERE target_document_id = $1 AND closing_document_id = $2',
            [targetId, closingId],
          );
          if (existing.rowCount) throw conflict('already_allocated', 'This document is already applied to the target');
        }

        const { rows } = await client.query<{ id: number }>(
          'INSERT INTO allocations (target_document_id, closing_document_id, amount) VALUES ($1, $2, $3) RETURNING id',
          [targetId, closingId, fromCents(amountCents)],
        );
        const allocation = await client.query<AllocationRow>(`${ALLOCATION_SELECT} WHERE a.id = $1`, [rows[0].id]);
        return allocation.rows[0];
      });
    },

    async removeAllocation(id) {
      const { rowCount } = await db.query('DELETE FROM allocations WHERE id = $1', [id]);
      if (!rowCount) throw notFound(`Allocation ${id} not found`);
    },

    cancel(id) {
      return inTransaction(db, async (client) => {
        const document = await findSummary(client, id);
        if (!document) throw notFound(`Document ${id} not found`);
        if (document.cancelled_at) throw conflict('document_cancelled', 'The document is already cancelled');
        if (await hasAllocations(client, id)) {
          throw conflict('has_allocations', 'Remove the closing links before cancelling the document');
        }
        await client.query('UPDATE documents SET cancelled_at = now(), updated_at = now() WHERE id = $1', [id]);
      });
    },

    softDelete(id) {
      return inTransaction(db, async (client) => {
        const document = await findSummary(client, id);
        if (!document) throw notFound(`Document ${id} not found`);
        if (await hasAllocations(client, id)) {
          throw conflict('has_allocations', 'Remove the closing links before deleting the document');
        }
        await client.query('UPDATE documents SET deleted_at = now(), updated_at = now() WHERE id = $1', [id]);
      });
    },
  };
};
