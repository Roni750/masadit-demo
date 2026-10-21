import type pg from 'pg';
import type { ClientRow, ClientUpdate, LedgerRow } from './types.js';

export interface ClientsRepository {
  findById(id: number): Promise<ClientRow | null>;
  update(id: number, changes: ClientUpdate): Promise<ClientRow | null>;
  // Bookkeeping ledger, oldest first, with a running balance
  ledger(id: number): Promise<LedgerRow[]>;
}

const CLIENT_COLUMNS = `id, name, tax_id, payment_terms, is_active, phone, mobile, fax, email, delivery_email,
  contact_name, street, house_number, city, zip, po_box, country, balance_code, sort_code, opening_balance`;

// Columns a PATCH may change. Keys come from this list only, never from the request, so they're safe in SQL.
const UPDATABLE_COLUMNS = [
  'name',
  'tax_id',
  'payment_terms',
  'is_active',
  'phone',
  'mobile',
  'fax',
  'email',
  'delivery_email',
  'contact_name',
  'street',
  'house_number',
  'city',
  'zip',
  'po_box',
  'country',
  'balance_code',
  'sort_code',
  'opening_balance',
] as const satisfies readonly (keyof ClientUpdate)[];

// Ledger entries: invoices debit the client (ח), credit invoices, receipts and payments credit them (ז).
// The balance is credits minus debits, so a positive balance means the client paid more than billed.
// Quotes, orders, delivery notes and proforma invoices aren't accounting documents and stay out.
const LEDGER_SQL = `
  WITH entries AS (
    SELECT c.created_at::date AS entry_date, 0 AS sort_order, NULL::bigint AS document_id,
           NULL::document_type AS document_type, NULL::integer AS document_number,
           CASE WHEN c.opening_balance > 0 THEN c.opening_balance ELSE 0 END AS debit,
           CASE WHEN c.opening_balance < 0 THEN -c.opening_balance ELSE 0 END AS credit,
           'opening_balance' AS kind
    FROM clients c
    WHERE c.id = $1 AND c.opening_balance <> 0

    UNION ALL

    SELECT s.issued_at, 1, s.id, s.type, s.number,
           CASE WHEN s.type IN ('tax_invoice', 'tax_invoice_receipt', 'smart_invoice', 'self_invoice') THEN s.total_ils ELSE 0 END,
           CASE WHEN s.type IN ('credit_invoice', 'receipt') THEN s.total_ils ELSE 0 END,
           'document'
    FROM document_summaries s
    WHERE s.client_id = $1 AND s.cancelled_at IS NULL
      AND s.type IN ('tax_invoice', 'tax_invoice_receipt', 'smart_invoice', 'self_invoice', 'credit_invoice', 'receipt')

    UNION ALL

    -- Payments recorded on documents (e.g. the payment part of a tax invoice/receipt)
    SELECT p.paid_at, 2, s.id, s.type, s.number, 0, p.amount, 'payment'
    FROM payments p
    JOIN document_summaries s ON s.id = p.document_id
    WHERE s.client_id = $1 AND s.cancelled_at IS NULL
  )
  SELECT entry_date::text AS entry_date, document_id, document_type, document_number, kind,
         debit::numeric(12, 2) AS debit, credit::numeric(12, 2) AS credit,
         SUM(credit - debit) OVER (ORDER BY entry_date, sort_order, document_id ROWS UNBOUNDED PRECEDING)::numeric(12, 2) AS balance
  FROM entries
  ORDER BY entry_date, sort_order, document_id
`;

export const createPgClientsRepository = (db: pg.Pool): ClientsRepository => ({
  async findById(id) {
    const { rows } = await db.query<ClientRow>(`SELECT ${CLIENT_COLUMNS} FROM clients WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async update(id, changes) {
    const columns = UPDATABLE_COLUMNS.filter((column) => changes[column] !== undefined);
    if (columns.length === 0) return this.findById(id);

    const assignments = columns.map((column, index) => `${column} = $${index + 2}`);
    const { rows } = await db.query<ClientRow>(
      `UPDATE clients SET ${assignments.join(', ')}, updated_at = now() WHERE id = $1 RETURNING ${CLIENT_COLUMNS}`,
      [id, ...columns.map((column) => changes[column])],
    );
    return rows[0] ?? null;
  },

  async ledger(id) {
    const { rows } = await db.query<LedgerRow>(LEDGER_SQL, [id]);
    return rows;
  },
});
