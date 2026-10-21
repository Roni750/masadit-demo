import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';
import type { ClientsRepository } from './clients/repository.js';
import type { ClientRow } from './clients/types.js';
import type { DocumentsRepository } from './documents/repository.js';
import type { DocumentDetailRow, DocumentSummaryRow } from './documents/types.js';

const summary = (overrides: Partial<DocumentSummaryRow>): DocumentSummaryRow => ({
  id: 1,
  type: 'tax_invoice',
  number: 1000,
  client_id: 1,
  client_name: 'Air Dell',
  client_email: null,
  client_payment_terms: 'current',
  branch_number: 1,
  issued_at: '2021-06-13',
  currency: 'ILS',
  exchange_rate: '1.000000',
  vat_rate: '17.00',
  cancelled_at: null,
  exempt_subtotal: '0.00',
  taxable_subtotal: '9.40',
  vat_amount: '1.60',
  total: '11.00',
  total_ils: '11.00',
  vat_amount_ils: '1.60',
  allocated_ils: '0',
  open_balance_ils: '11.00',
  status: 'open',
  credited_document_id: null,
  credited_document_number: null,
  credited_document_type: null,
  ...overrides,
});

const detail = (overrides: Partial<DocumentSummaryRow>): DocumentDetailRow => ({
  ...summary(overrides),
  lines: [],
  payments: [],
  allocations: [],
});

const client: ClientRow = {
  id: 1,
  name: 'Air Dell',
  tax_id: null,
  payment_terms: 'current',
  is_active: true,
  phone: null,
  mobile: null,
  fax: null,
  email: null,
  delivery_email: null,
  contact_name: null,
  street: null,
  house_number: null,
  city: null,
  zip: null,
  po_box: null,
  country: null,
  balance_code: null,
  sort_code: null,
  opening_balance: '0.00',
};

const setup = () => {
  const taxInvoice = detail({ id: 1, type: 'tax_invoice' });
  const creditInvoice = summary({ id: 2, type: 'credit_invoice', credited_document_id: 1 });

  const documents: DocumentsRepository = {
    list: vi.fn(async (_filter, page, pageSize) => ({
      items: [creditInvoice, taxInvoice],
      page,
      page_size: pageSize,
      total_items: 2,
    })),
    typeTotals: vi.fn(async () => [{ type: 'tax_invoice' as const, count: 1, total_ils: '11.00' }]),
    findById: vi.fn(async (id) => (id === taxInvoice.id ? taxInvoice : null)),
    closingCandidates: vi.fn(async () => [creditInvoice]),
    closableBy: vi.fn(async () => []),
    allocate: vi.fn(async (targetId, closingId) => ({
      id: 10,
      target_document_id: targetId,
      target_document_type: 'tax_invoice' as const,
      target_document_number: 1000,
      closing_document_id: closingId,
      closing_document_type: closingId ? ('credit_invoice' as const) : null,
      closing_document_number: closingId ? 1000 : null,
      amount: '11.00',
      created_at: '2026-10-21T10:00:00Z',
    })),
    removeAllocation: vi.fn(async () => {}),
    cancel: vi.fn(async () => {}),
    softDelete: vi.fn(async () => {}),
  };
  const clients: ClientsRepository = {
    findById: vi.fn(async (id) => (id === client.id ? client : null)),
    update: vi.fn(async (id, changes) => (id === client.id ? { ...client, ...changes } : null)),
    ledger: vi.fn(async () => [
      {
        entry_date: '2021-06-13',
        document_id: 1,
        document_type: 'tax_invoice' as const,
        document_number: 1000,
        kind: 'document' as const,
        debit: '11.00',
        credit: '0.00',
        balance: '-11.00',
      },
    ]),
  };

  return { app: createApp({ documents, clients }), documents, clients };
};

describe('GET /documents', () => {
  it('passes parsed filters and pagination to the repository', async () => {
    const { app, documents } = setup();

    const res = await request(app).get('/documents?type=credit_invoice&status=open&client_id=1&page=2&page_size=5');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 2, page_size: 5, total_items: 2 });
    expect(documents.list).toHaveBeenCalledWith(
      { type: 'credit_invoice', status: 'open', clientId: 1, search: undefined },
      2,
      5,
    );
  });

  it('defaults to the first page of 20', async () => {
    const { app, documents } = setup();

    await request(app).get('/documents');

    expect(documents.list).toHaveBeenCalledWith(expect.anything(), 1, 20);
  });

  it.each([
    ['an unknown type', 'type=invoice'],
    ['a page size above 50', 'page_size=500'],
    ['a non-numeric page', 'page=abc'],
  ])('rejects %s with a 400', async (_case, query) => {
    const { app, documents } = setup();

    const res = await request(app).get(`/documents?${query}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_request');
    expect(documents.list).not.toHaveBeenCalled();
  });
});

describe('GET /documents/type-totals', () => {
  it('returns the per-type totals', async () => {
    const { app } = setup();

    const res = await request(app).get('/documents/type-totals?client_id=1');

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([{ type: 'tax_invoice', count: 1, total_ils: '11.00' }]);
  });
});

describe('GET /documents/:id', () => {
  it('returns the document', async () => {
    const { app } = setup();

    const res = await request(app).get('/documents/1');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, type: 'tax_invoice', lines: [] });
  });

  it('returns 404 in the shared error shape for a missing document', async () => {
    const { app } = setup();

    const res = await request(app).get('/documents/999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'not_found', message: 'Document 999 not found' } });
  });

  it('rejects a non-numeric id', async () => {
    const { app } = setup();

    const res = await request(app).get('/documents/abc');

    expect(res.status).toBe(400);
  });
});

describe('GET /documents/:id/closing-candidates', () => {
  it('returns candidates for an existing document', async () => {
    const { app } = setup();

    const res = await request(app).get('/documents/1/closing-candidates');

    expect(res.status).toBe(200);
    expect(res.body.items.map((d: DocumentSummaryRow) => d.id)).toEqual([2]);
  });

  it('returns 404 for a missing document', async () => {
    const { app, documents } = setup();

    const res = await request(app).get('/documents/999/closing-candidates');

    expect(res.status).toBe(404);
    expect(documents.closingCandidates).not.toHaveBeenCalled();
  });
});

describe('POST /documents/:id/allocations', () => {
  it('closes a document with another document', async () => {
    const { app, documents } = setup();

    const res = await request(app).post('/documents/1/allocations').send({ closing_document_id: 2 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ target_document_id: 1, closing_document_id: 2 });
    expect(documents.allocate).toHaveBeenCalledWith(1, 2);
  });

  it('treats a missing closing document as a manual close', async () => {
    const { app, documents } = setup();

    const res = await request(app).post('/documents/1/allocations').send({});

    expect(res.status).toBe(201);
    expect(documents.allocate).toHaveBeenCalledWith(1, null);
  });

  it('rejects a non-numeric closing document', async () => {
    const { app, documents } = setup();

    const res = await request(app).post('/documents/1/allocations').send({ closing_document_id: 'two' });

    expect(res.status).toBe(400);
    expect(documents.allocate).not.toHaveBeenCalled();
  });

  it('passes repository conflicts through as 409', async () => {
    const { app, documents } = setup();
    const { conflict } = await import('./http/errors.js');
    vi.mocked(documents.allocate).mockRejectedValueOnce(conflict('already_closed', 'The document is already closed'));

    const res = await request(app).post('/documents/1/allocations').send({});

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('already_closed');
  });
});

describe('document state changes', () => {
  it.each([
    ['DELETE', '/allocations/10', 'removeAllocation'],
    ['POST', '/documents/1/cancel', 'cancel'],
    ['DELETE', '/documents/1', 'softDelete'],
  ] as const)('%s %s responds 204', async (method, path, repositoryMethod) => {
    const { app, documents } = setup();

    const res = method === 'POST' ? await request(app).post(path) : await request(app).delete(path);

    expect(res.status).toBe(204);
    expect(documents[repositoryMethod]).toHaveBeenCalledWith(Number(path.split('/')[2]));
  });
});

describe('GET /clients/:id', () => {
  it('returns the client', async () => {
    const { app } = setup();

    const res = await request(app).get('/clients/1');

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Air Dell');
  });

  it('returns 404 for a missing client', async () => {
    const { app } = setup();

    const res = await request(app).get('/clients/2');

    expect(res.status).toBe(404);
  });
});

describe('PATCH /clients/:id', () => {
  it('updates allowed fields, trimming text and clearing empty values', async () => {
    const { app, clients } = setup();

    const res = await request(app)
      .patch('/clients/1')
      .send({ name: '  Air Dell Ltd ', phone: '', email: 'billing@airdell.example', is_active: false });

    expect(res.status).toBe(200);
    expect(clients.update).toHaveBeenCalledWith(1, {
      name: 'Air Dell Ltd',
      phone: null,
      email: 'billing@airdell.example',
      is_active: false,
    });
  });

  it.each([
    ['an empty name', { name: '' }],
    ['an invalid email', { email: 'nope' }],
    ['unknown payment terms', { payment_terms: 'whenever' }],
    ['a malformed opening balance', { opening_balance: '12.345' }],
    ['an unknown field', { id: 5 }],
  ])('rejects %s', async (_case, body) => {
    const { app, clients } = setup();

    const res = await request(app).patch('/clients/1').send(body);

    expect(res.status).toBe(400);
    expect(clients.update).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing client', async () => {
    const { app } = setup();

    const res = await request(app).patch('/clients/2').send({ name: 'X' });

    expect(res.status).toBe(404);
  });
});

describe('GET /clients/:id/ledger', () => {
  it('returns the entries and the closing balance', async () => {
    const { app } = setup();

    const res = await request(app).get('/clients/1/ledger');

    expect(res.status).toBe(200);
    expect(res.body.balance).toBe('-11.00');
    expect(res.body.entries).toHaveLength(1);
  });
});

it('returns 404 in the shared error shape for unknown routes', async () => {
  const { app } = setup();

  const res = await request(app).get('/nope');

  expect(res.status).toBe(404);
  expect(res.body.error.code).toBe('not_found');
});
