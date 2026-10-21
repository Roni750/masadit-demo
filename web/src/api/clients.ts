// Adapter for the clients API: raw shapes and mappers in both directions stay in this file.

import type { Client, ClientChanges, Ledger } from '../domain/clients';
import { documentTypeFromApi, type ApiDocumentType } from './documents';
import { getJson, sendJson } from './http';
import { TERMS_FROM_API, TERMS_TO_API, type ApiPaymentTerms } from './paymentTerms';

// ----- Raw API shapes -----

interface ApiClient {
  id: number;
  name: string;
  tax_id: string | null;
  payment_terms: ApiPaymentTerms;
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

interface ApiLedger {
  entries: {
    entry_date: string;
    document_id: number | null;
    document_type: ApiDocumentType | null;
    document_number: number | null;
    kind: 'opening_balance' | 'document' | 'payment';
    debit: string;
    credit: string;
    balance: string;
  }[];
  balance: string;
}

// ----- Mappers -----

const ils = (amount: string) => ({ amount: Number(amount), currency: 'ILS' });

export const toClient = (raw: ApiClient): Client => ({
  id: raw.id,
  name: raw.name,
  taxId: raw.tax_id,
  paymentTerms: TERMS_FROM_API[raw.payment_terms],
  isActive: raw.is_active,
  phone: raw.phone,
  mobile: raw.mobile,
  fax: raw.fax,
  email: raw.email,
  deliveryEmail: raw.delivery_email,
  contactName: raw.contact_name,
  address: {
    street: raw.street,
    houseNumber: raw.house_number,
    city: raw.city,
    zip: raw.zip,
    poBox: raw.po_box,
    country: raw.country,
  },
  balanceCode: raw.balance_code,
  sortCode: raw.sort_code,
  openingBalance: ils(raw.opening_balance),
});

// Outbound: the app's model back into the API's PATCH body
export const toApiClientChanges = (changes: ClientChanges): Omit<ApiClient, 'id'> => ({
  name: changes.name,
  tax_id: changes.taxId,
  payment_terms: TERMS_TO_API[changes.paymentTerms],
  is_active: changes.isActive,
  phone: changes.phone,
  mobile: changes.mobile,
  fax: changes.fax,
  email: changes.email,
  delivery_email: changes.deliveryEmail,
  contact_name: changes.contactName,
  street: changes.address.street,
  house_number: changes.address.houseNumber,
  city: changes.address.city,
  zip: changes.address.zip,
  po_box: changes.address.poBox,
  country: changes.address.country,
  balance_code: changes.balanceCode,
  sort_code: changes.sortCode,
  opening_balance: changes.openingBalance.amount.toFixed(2),
});

const KIND_FROM_API = { opening_balance: 'openingBalance', document: 'document', payment: 'payment' } as const;

const toLedger = (raw: ApiLedger): Ledger => ({
  entries: raw.entries
    .map((entry) => ({
      date: entry.entry_date,
      kind: KIND_FROM_API[entry.kind],
      document:
        entry.document_id !== null && entry.document_type !== null && entry.document_number !== null
          ? { id: entry.document_id, type: documentTypeFromApi(entry.document_type), number: entry.document_number }
          : null,
      debit: ils(entry.debit),
      credit: ils(entry.credit),
      balance: ils(entry.balance),
    }))
    .reverse(),
  balance: ils(raw.balance),
});

// ----- Requests -----

export const fetchClient = async (id: number, signal?: AbortSignal) =>
  toClient(await getJson<ApiClient>(`/clients/${id}`, undefined, signal));

export const updateClient = async (id: number, changes: ClientChanges) =>
  toClient(await sendJson<ApiClient>('PATCH', `/clients/${id}`, toApiClientChanges(changes)));

export const fetchLedger = async (clientId: number, signal?: AbortSignal) =>
  toLedger(await getJson<ApiLedger>(`/clients/${clientId}/ledger`, undefined, signal));
