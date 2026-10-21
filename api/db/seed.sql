-- Demo data reproducing the legacy app's test account (client "Air Dell").
-- Running it resets all data.

TRUNCATE allocations, payments, document_lines,
  quotes, orders, deal_invoices, smart_invoices, tax_invoices, tax_invoice_receipts,
  credit_invoices, receipts, delivery_notes, self_invoices,
  documents, clients
  RESTART IDENTITY CASCADE;

INSERT INTO clients (id, name, payment_terms, is_active) VALUES
  (1, 'Air Dell', 'current', true);

INSERT INTO documents (id, type, number, client_id, issued_at, currency, exchange_rate, vat_rate) VALUES
  (1, 'tax_invoice',         1000, 1, '2021-06-13', 'ILS', 1,      17),
  (2, 'credit_invoice',      1000, 1, '2021-06-13', 'ILS', 1,      17),
  (3, 'credit_invoice',      1001, 1, '2021-06-13', 'ILS', 1,      17),
  (4, 'credit_invoice',      1002, 1, '2021-06-13', 'ILS', 1,      17),
  (5, 'tax_invoice',         1001, 1, '2021-10-20', 'ILS', 1,      17),
  (6, 'tax_invoice_receipt', 1000, 1, '2026-10-19', 'USD', 3.0888, 18),
  (7, 'quote',               1000, 1, '2026-10-20', 'ILS', 1,      18),
  (8, 'quote',               1001, 1, '2026-10-20', 'ILS', 1,      18);

INSERT INTO tax_invoices (id) VALUES (1), (5);
INSERT INTO credit_invoices (id, credited_document_id) VALUES (2, 1), (3, 1), (4, 1);
INSERT INTO tax_invoice_receipts (id) VALUES (6);
INSERT INTO quotes (id) VALUES (7), (8);

INSERT INTO document_lines (document_id, position, description, quantity, unit_price, vat_exempt) VALUES
  (1, 1, 'מכירות',         1, 9.40,  false),
  (2, 1, 'מכירות',         1, 9.40,  false),
  (3, 1, 'מכירות',         1, 9.40,  false),
  (4, 1, 'מכירות',         1, 9.40,  false),
  (5, 1, 'מכירות פטורות', 1, 11.00, true),
  (6, 1, 'מכירות',         1, 21.37, false),
  (7, 1, 'מכירות',         2, 0.00,  false),
  (8, 1, 'מכירות',         1, 6.00,  false);

INSERT INTO payments (document_id, method, paid_at, amount) VALUES
  (6, 'bank_transfer', '2026-10-19', 77.88);

-- The tax invoice/receipt was closed manually in the legacy app
INSERT INTO allocations (target_document_id, closing_document_id, amount) VALUES
  (6, NULL, 77.90);

-- Explicit ids above don't advance the identity sequences
SELECT setval(pg_get_serial_sequence('clients', 'id'), (SELECT MAX(id) FROM clients));
SELECT setval(pg_get_serial_sequence('documents', 'id'), (SELECT MAX(id) FROM documents));
