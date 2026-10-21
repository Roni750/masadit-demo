import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchDocuments, toDocumentSummary } from './documents';

const rawCreditInvoice = {
  id: 2,
  type: 'credit_invoice' as const,
  number: 1000,
  client_id: 1,
  client_name: 'Air Dell',
  client_email: null,
  client_payment_terms: 'current' as const,
  branch_number: 1,
  issued_at: '2021-06-13',
  currency: 'ILS',
  vat_rate: '17.00',
  cancelled_at: null,
  vat_amount: '1.60',
  total: '11.00',
  total_ils: '11.00',
  vat_amount_ils: '1.60',
  open_balance_ils: '11.00',
  status: 'open' as const,
  credited_document_id: 1,
  credited_document_number: 1000,
  credited_document_type: 'tax_invoice' as const,
};

describe('toDocumentSummary', () => {
  it('maps the API shape to the domain model', () => {
    expect(toDocumentSummary(rawCreditInvoice)).toEqual({
      id: 2,
      type: 'creditInvoice',
      number: 1000,
      client: { id: 1, name: 'Air Dell', email: null, paymentTerms: 'current' },
      branchNumber: 1,
      issuedAt: '2021-06-13',
      status: 'open',
      isCancelled: false,
      vatRate: 17,
      total: { amount: 11, currency: 'ILS' },
      vat: { amount: 1.6, currency: 'ILS' },
      totalIls: { amount: 11, currency: 'ILS' },
      vatIls: { amount: 1.6, currency: 'ILS' },
      openBalanceIls: { amount: 11, currency: 'ILS' },
      credits: { id: 1, type: 'taxInvoice', number: 1000 },
    });
  });

  it('keeps foreign-currency amounts apart from their ILS conversion', () => {
    const summary = toDocumentSummary({
      ...rawCreditInvoice,
      type: 'tax_invoice_receipt',
      currency: 'USD',
      total: '25.22',
      total_ils: '77.90',
      credited_document_id: null,
      credited_document_number: null,
      credited_document_type: null,
    });

    expect(summary.total).toEqual({ amount: 25.22, currency: 'USD' });
    expect(summary.totalIls).toEqual({ amount: 77.9, currency: 'ILS' });
    expect(summary.credits).toBeNull();
  });
});

describe('fetchDocuments', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends the filter in API terms and reports whether more pages exist', async () => {
    const fetchMock = vi.fn(async () => Response.json({ items: [rawCreditInvoice], page: 1, page_size: 1, total_items: 3 }));
    vi.stubGlobal('fetch', fetchMock);

    const page = await fetchDocuments({ type: 'creditInvoice', search: 'Air' }, 1, 1);

    const url = new URL(String((fetchMock.mock.calls[0] as unknown[])[0]));
    expect(url.pathname).toBe('/documents');
    expect(Object.fromEntries(url.searchParams)).toEqual({ type: 'credit_invoice', search: 'Air', page: '1', page_size: '1' });
    expect(page.hasMore).toBe(true);
    expect(page.items[0].type).toBe('creditInvoice');
  });

  it('turns API errors into ApiError with the server code', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      Response.json({ error: { code: 'invalid_request', message: 'bad type' } }, { status: 400 }),
    ));

    await expect(fetchDocuments({}, 1, 20)).rejects.toMatchObject({ status: 400, code: 'invalid_request' });
  });
});
