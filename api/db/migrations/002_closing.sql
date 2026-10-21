-- Closing documents against each other.
--
-- 1. A manual close of a zero-total document (e.g. a ₪0 quote) records a zero amount.
-- 2. The same closing document can't be applied to the same target twice, and a document
--    has at most one manual close.
-- 3. "Consuming" closers (credit invoices, receipts) use up their own balance when applied:
--    a ₪11 credit invoice applied to an invoice is itself fully used. Converting closers
--    (e.g. the tax invoice a quote turned into) close the target without being consumed.
--    Keep this list in sync with CONSUMING_CLOSER_TYPES in api/src/documents/closing-rules.ts.

ALTER TABLE allocations DROP CONSTRAINT allocations_amount_check;
ALTER TABLE allocations ADD CONSTRAINT allocations_amount_check
  CHECK (amount > 0 OR (closing_document_id IS NULL AND amount >= 0));

CREATE UNIQUE INDEX allocations_pair_unique
  ON allocations (target_document_id, closing_document_id)
  WHERE closing_document_id IS NOT NULL;

CREATE UNIQUE INDEX allocations_manual_unique
  ON allocations (target_document_id)
  WHERE closing_document_id IS NULL;

CREATE OR REPLACE VIEW document_summaries AS
WITH line_totals AS (
  SELECT
    d.id AS document_id,
    COALESCE(SUM(l.quantity * l.unit_price) FILTER (WHERE l.vat_exempt), 0) AS exempt_subtotal,
    COALESCE(SUM(l.quantity * l.unit_price) FILTER (WHERE NOT l.vat_exempt), 0) AS taxable_subtotal
  FROM documents d
  LEFT JOIN document_lines l ON l.document_id = d.id
  GROUP BY d.id
),
amounts AS (
  SELECT
    d.*,
    ROUND(t.exempt_subtotal, 2) AS exempt_subtotal,
    ROUND(t.taxable_subtotal, 2) AS taxable_subtotal,
    ROUND(t.taxable_subtotal * d.vat_rate / 100, 2) AS vat_amount
  FROM documents d
  JOIN line_totals t ON t.document_id = d.id
),
allocation_sides AS (
  -- Amounts closed on a document (it was the target)
  SELECT a.target_document_id AS document_id, a.amount, a.closing_document_id IS NULL AS manual
  FROM allocations a
  UNION ALL
  -- Amounts a consuming document has used up (it was the closer)
  SELECT a.closing_document_id, a.amount, false
  FROM allocations a
  JOIN documents closer ON closer.id = a.closing_document_id
  WHERE closer.type IN ('credit_invoice', 'receipt')
),
allocated AS (
  SELECT document_id, SUM(amount) AS allocated_amount, bool_or(manual) AS manually_closed
  FROM allocation_sides
  GROUP BY document_id
)
SELECT
  a.id,
  a.type,
  a.number,
  a.client_id,
  a.branch_number,
  a.issued_at,
  a.currency,
  a.exchange_rate,
  a.vat_rate,
  a.cancelled_at,
  a.exempt_subtotal,
  a.taxable_subtotal,
  a.vat_amount,
  a.exempt_subtotal + a.taxable_subtotal + a.vat_amount AS total,
  ROUND((a.exempt_subtotal + a.taxable_subtotal + a.vat_amount) * a.exchange_rate, 2) AS total_ils,
  ROUND(a.vat_amount * a.exchange_rate, 2) AS vat_amount_ils,
  COALESCE(al.allocated_amount, 0) AS allocated_ils,
  GREATEST(ROUND((a.exempt_subtotal + a.taxable_subtotal + a.vat_amount) * a.exchange_rate, 2)
    - COALESCE(al.allocated_amount, 0), 0) AS open_balance_ils,
  CASE
    WHEN COALESCE(al.manually_closed, false) THEN 'closed'
    WHEN COALESCE(al.allocated_amount, 0) > 0
      AND al.allocated_amount >= ROUND((a.exempt_subtotal + a.taxable_subtotal + a.vat_amount) * a.exchange_rate, 2)
      THEN 'closed'
    ELSE 'open'
  END AS status
FROM amounts a
LEFT JOIN allocated al ON al.document_id = a.id
WHERE a.deleted_at IS NULL;
