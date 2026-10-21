import type { PaymentTerms } from './clients';

// The app's own document model. Components only ever see these types;
// the API's shapes are translated in src/api (the adapter layer).

export const DOCUMENT_TYPES = [
  'quote',
  'order',
  'dealInvoice',
  'smartInvoice',
  'taxInvoice',
  'taxInvoiceReceipt',
  'creditInvoice',
  'receipt',
  'deliveryNote',
  'selfInvoice',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export type DocumentStatus = 'open' | 'closed';

export interface Money {
  amount: number;
  currency: string;
}

export interface DocumentRef {
  id: number;
  type: DocumentType;
  number: number;
}

export interface DocumentSummary {
  id: number;
  type: DocumentType;
  number: number;
  client: { id: number; name: string; email: string | null; paymentTerms: PaymentTerms };
  branchNumber: number;
  issuedAt: string;
  status: DocumentStatus;
  isCancelled: boolean;
  vatRate: number;
  /** In the document's own currency */
  total: Money;
  vat: Money;
  /** Converted to ILS, the business's reporting currency */
  totalIls: Money;
  vatIls: Money;
  openBalanceIls: Money;
  /** For credit invoices: the document being credited */
  credits: DocumentRef | null;
}

export interface DocumentLine {
  id: number;
  description: string;
  quantity: number;
  unitPrice: Money;
  total: Money;
  vatExempt: boolean;
}

export type PaymentMethod = 'bankTransfer' | 'cash' | 'check' | 'creditCard' | 'other';

export interface Payment {
  id: number;
  method: PaymentMethod;
  paidAt: string;
  amountIls: Money;
}

/** One document closing (part of) another. A null closer is a manual close. */
export interface Allocation {
  id: number;
  target: DocumentRef;
  closer: DocumentRef | null;
  amountIls: Money;
}

export interface DocumentDetail extends DocumentSummary {
  exemptSubtotal: Money;
  taxableSubtotal: Money;
  lines: DocumentLine[];
  payments: Payment[];
  /** Allocations that close this document */
  closedBy: Allocation[];
  /** Allocations where this document closes others */
  closes: Allocation[];
}

export interface DocumentFilter {
  type?: DocumentType;
  status?: DocumentStatus;
  clientId?: number;
  search?: string;
}

export interface TypeTotal {
  type: DocumentType;
  count: number;
  totalIls: Money;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  hasMore: boolean;
}

export const isForeignCurrency = (document: DocumentSummary) => document.total.currency !== 'ILS';
