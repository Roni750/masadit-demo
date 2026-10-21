import type { DocumentType } from '../documents/types.js';

export const PAYMENT_TERMS = ['immediate', 'current', 'current_30', 'current_60', 'current_90'] as const;
export type PaymentTerms = (typeof PAYMENT_TERMS)[number];

export interface ClientRow {
  id: number;
  name: string;
  tax_id: string | null;
  payment_terms: string;
  is_active: boolean;
  phone: string | null;
  mobile: string | null;
  fax: string | null;
  email: string | null;
  delivery_email: string | null;
  contact_name: string | null;
  street: string | null;
  house_number: string | null;
  city: string | null;
  zip: string | null;
  po_box: string | null;
  country: string | null;
  balance_code: string | null;
  sort_code: string | null;
  opening_balance: string;
}

export type ClientUpdate = Partial<Omit<ClientRow, 'id'>>;

export interface LedgerRow {
  entry_date: string;
  document_id: number | null;
  document_type: DocumentType | null;
  document_number: number | null;
  kind: 'opening_balance' | 'document' | 'payment';
  debit: string;
  credit: string;
  balance: string;
}
