// Adapter for the documents API. Raw response shapes stay in this file; everything
// returned from here uses the app's domain types. When the real backend replaces
// the mock, the raw types and mappers here change and the rest of the app doesn't.

import type {
  Allocation,
  DocumentDetail,
  DocumentFilter,
  DocumentSummary,
  DocumentType,
  Paginated,
  PaymentMethod,
  TypeTotal,
} from '../domain/documents';
import { getJson, sendJson } from './http';
import { TERMS_FROM_API, type ApiPaymentTerms } from './paymentTerms';

// ----- Raw API shapes -----

export type ApiDocumentType =
  | 'quote'
  | 'order'
  | 'deal_invoice'
  | 'smart_invoice'
  | 'tax_invoice'
  | 'tax_invoice_receipt'
  | 'credit_invoice'
  | 'receipt'
  | 'delivery_note'
  | 'self_invoice';

interface ApiDocumentSummary {
  id: number;
  type: ApiDocumentType;
  number: number;
  client_id: number;
  client_name: string;
  client_email: string | null;
  client_payment_terms: ApiPaymentTerms;
  branch_number: number;
  issued_at: string;
  currency: string;
  vat_rate: string;
  cancelled_at: string | null;
  vat_amount: string;
  total: string;
  total_ils: string;
  vat_amount_ils: string;
  open_balance_ils: string;
  status: 'open' | 'closed';
  credited_document_id: number | null;
  credited_document_number: number | null;
  credited_document_type: ApiDocumentType | null;
}

type ApiPaymentMethod = 'bank_transfer' | 'cash' | 'check' | 'credit_card' | 'other';

interface ApiAllocation {
  id: number;
  target_document_id: number;
  target_document_type: ApiDocumentType;
  target_document_number: number;
  closing_document_id: number | null;
  closing_document_type: ApiDocumentType | null;
  closing_document_number: number | null;
  amount: string;
}

interface ApiDocumentDetail extends ApiDocumentSummary {
  exempt_subtotal: string;
  taxable_subtotal: string;
  lines: { id: number; description: string; quantity: string; unit_price: string; vat_exempt: boolean }[];
  payments: { id: number; method: ApiPaymentMethod; paid_at: string; amount: string }[];
  allocations: ApiAllocation[];
}

interface ApiPage<T> {
  items: T[];
  page: number;
  page_size: number;
  total_items: number;
}

interface ApiTypeTotal {
  type: ApiDocumentType;
  count: number;
  total_ils: string;
}

// ----- Mappers -----

const TYPE_FROM_API: Record<ApiDocumentType, DocumentType> = {
  quote: 'quote',
  order: 'order',
  deal_invoice: 'dealInvoice',
  smart_invoice: 'smartInvoice',
  tax_invoice: 'taxInvoice',
  tax_invoice_receipt: 'taxInvoiceReceipt',
  credit_invoice: 'creditInvoice',
  receipt: 'receipt',
  delivery_note: 'deliveryNote',
  self_invoice: 'selfInvoice',
};

export const documentTypeFromApi = (type: ApiDocumentType): DocumentType => TYPE_FROM_API[type];

const TYPE_TO_API = Object.fromEntries(
  Object.entries(TYPE_FROM_API).map(([api, domain]) => [domain, api]),
) as Record<DocumentType, ApiDocumentType>;

const ils = (amount: string) => ({ amount: Number(amount), currency: 'ILS' });

export const toDocumentSummary = (raw: ApiDocumentSummary): DocumentSummary => ({
  id: raw.id,
  type: TYPE_FROM_API[raw.type],
  number: raw.number,
  client: {
    id: raw.client_id,
    name: raw.client_name,
    email: raw.client_email,
    paymentTerms: TERMS_FROM_API[raw.client_payment_terms],
  },
  branchNumber: raw.branch_number,
  issuedAt: raw.issued_at,
  status: raw.status,
  isCancelled: raw.cancelled_at !== null,
  vatRate: Number(raw.vat_rate),
  total: { amount: Number(raw.total), currency: raw.currency },
  vat: { amount: Number(raw.vat_amount), currency: raw.currency },
  totalIls: ils(raw.total_ils),
  vatIls: ils(raw.vat_amount_ils),
  openBalanceIls: ils(raw.open_balance_ils),
  credits:
    raw.credited_document_id !== null && raw.credited_document_type !== null && raw.credited_document_number !== null
      ? { id: raw.credited_document_id, type: TYPE_FROM_API[raw.credited_document_type], number: raw.credited_document_number }
      : null,
});

const PAYMENT_METHOD_FROM_API: Record<ApiPaymentMethod, PaymentMethod> = {
  bank_transfer: 'bankTransfer',
  cash: 'cash',
  check: 'check',
  credit_card: 'creditCard',
  other: 'other',
};

const toAllocation = (raw: ApiAllocation): Allocation => ({
  id: raw.id,
  target: { id: raw.target_document_id, type: TYPE_FROM_API[raw.target_document_type], number: raw.target_document_number },
  closer:
    raw.closing_document_id !== null && raw.closing_document_type !== null && raw.closing_document_number !== null
      ? { id: raw.closing_document_id, type: TYPE_FROM_API[raw.closing_document_type], number: raw.closing_document_number }
      : null,
  amountIls: ils(raw.amount),
});

export const toDocumentDetail = (raw: ApiDocumentDetail): DocumentDetail => {
  const inDocumentCurrency = (amount: number) => ({ amount, currency: raw.currency });
  const allocations = raw.allocations.map(toAllocation);

  return {
    ...toDocumentSummary(raw),
    exemptSubtotal: inDocumentCurrency(Number(raw.exempt_subtotal)),
    taxableSubtotal: inDocumentCurrency(Number(raw.taxable_subtotal)),
    lines: raw.lines.map((line) => ({
      id: line.id,
      description: line.description,
      quantity: Number(line.quantity),
      unitPrice: inDocumentCurrency(Number(line.unit_price)),
      total: inDocumentCurrency(Number(line.quantity) * Number(line.unit_price)),
      vatExempt: line.vat_exempt,
    })),
    payments: raw.payments.map((payment) => ({
      id: payment.id,
      method: PAYMENT_METHOD_FROM_API[payment.method],
      paidAt: payment.paid_at,
      amountIls: ils(payment.amount),
    })),
    closedBy: allocations.filter((allocation) => allocation.target.id === raw.id),
    closes: allocations.filter((allocation) => allocation.closer?.id === raw.id),
  };
};

const toTypeTotal = (raw: ApiTypeTotal): TypeTotal => ({
  type: TYPE_FROM_API[raw.type],
  count: raw.count,
  totalIls: ils(raw.total_ils),
});

const toFilterQuery = (filter: DocumentFilter) => ({
  type: filter.type ? TYPE_TO_API[filter.type] : undefined,
  status: filter.status,
  client_id: filter.clientId,
  search: filter.search,
});

// ----- Requests -----

export const fetchDocuments = async (
  filter: DocumentFilter,
  page: number,
  pageSize: number,
  signal?: AbortSignal,
): Promise<Paginated<DocumentSummary>> => {
  const raw = await getJson<ApiPage<ApiDocumentSummary>>(
    '/documents',
    { ...toFilterQuery(filter), page, page_size: pageSize },
    signal,
  );
  return {
    items: raw.items.map(toDocumentSummary),
    page: raw.page,
    hasMore: raw.page * raw.page_size < raw.total_items,
  };
};

export const fetchTypeTotals = async (filter: Omit<DocumentFilter, 'type'>, signal?: AbortSignal): Promise<TypeTotal[]> => {
  const raw = await getJson<{ items: ApiTypeTotal[] }>('/documents/type-totals', toFilterQuery(filter), signal);
  return raw.items.map(toTypeTotal);
};

export const fetchDocument = async (id: number, signal?: AbortSignal): Promise<DocumentDetail> =>
  toDocumentDetail(await getJson<ApiDocumentDetail>(`/documents/${id}`, undefined, signal));

/** Documents that could close this one */
export const fetchClosingCandidates = async (id: number, signal?: AbortSignal): Promise<DocumentSummary[]> => {
  const raw = await getJson<{ items: ApiDocumentSummary[] }>(`/documents/${id}/closing-candidates`, undefined, signal);
  return raw.items.map(toDocumentSummary);
};

/** Documents this one could close */
export const fetchClosableDocuments = async (id: number, signal?: AbortSignal): Promise<DocumentSummary[]> => {
  const raw = await getJson<{ items: ApiDocumentSummary[] }>(`/documents/${id}/closable`, undefined, signal);
  return raw.items.map(toDocumentSummary);
};

/** closerId null closes the target manually */
export const createAllocation = async (targetId: number, closerId: number | null): Promise<Allocation> =>
  toAllocation(
    await sendJson<ApiAllocation>('POST', `/documents/${targetId}/allocations`, { closing_document_id: closerId }),
  );

export const deleteAllocation = (id: number) => sendJson<void>('DELETE', `/allocations/${id}`);

export const cancelDocument = (id: number) => sendJson<void>('POST', `/documents/${id}/cancel`);

export const deleteDocument = (id: number) => sendJson<void>('DELETE', `/documents/${id}`);
