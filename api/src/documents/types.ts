// Row shapes as stored. numeric columns arrive as strings to keep exact decimal values.

export const DOCUMENT_TYPES = [
  'quote',
  'order',
  'deal_invoice',
  'smart_invoice',
  'tax_invoice',
  'tax_invoice_receipt',
  'credit_invoice',
  'receipt',
  'delivery_note',
  'self_invoice',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export type DocumentStatus = 'open' | 'closed';

export interface DocumentSummaryRow {
  id: number;
  type: DocumentType;
  number: number;
  client_id: number;
  client_name: string;
  client_email: string | null;
  client_payment_terms: string;
  branch_number: number;
  issued_at: string;
  currency: string;
  exchange_rate: string;
  vat_rate: string;
  cancelled_at: string | null;
  exempt_subtotal: string;
  taxable_subtotal: string;
  vat_amount: string;
  total: string;
  total_ils: string;
  vat_amount_ils: string;
  allocated_ils: string;
  open_balance_ils: string;
  status: DocumentStatus;
  credited_document_id: number | null;
  credited_document_number: number | null;
  credited_document_type: DocumentType | null;
}

export interface DocumentLineRow {
  id: number;
  position: number;
  description: string;
  quantity: string;
  unit_price: string;
  vat_exempt: boolean;
}

export interface PaymentRow {
  id: number;
  method: string;
  paid_at: string;
  amount: string;
}

export interface AllocationRow {
  id: number;
  target_document_id: number;
  target_document_type: DocumentType;
  target_document_number: number;
  closing_document_id: number | null;
  closing_document_type: DocumentType | null;
  closing_document_number: number | null;
  amount: string;
  created_at: string;
}

export interface DocumentDetailRow extends DocumentSummaryRow {
  lines: DocumentLineRow[];
  payments: PaymentRow[];
  allocations: AllocationRow[];
}

export interface TypeTotalRow {
  type: DocumentType;
  count: number;
  total_ils: string;
}

export interface DocumentListFilter {
  type?: DocumentType;
  status?: DocumentStatus;
  clientId?: number;
  search?: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  page_size: number;
  total_items: number;
}
