import type { DocumentRef, Money } from './documents';

export const PAYMENT_TERMS = ['immediate', 'current', 'current30', 'current60', 'current90'] as const;
export type PaymentTerms = (typeof PAYMENT_TERMS)[number];

export interface Address {
  street: string | null;
  houseNumber: string | null;
  city: string | null;
  zip: string | null;
  poBox: string | null;
  country: string | null;
}

export interface Client {
  id: number;
  name: string;
  taxId: string | null;
  paymentTerms: PaymentTerms;
  isActive: boolean;
  phone: string | null;
  mobile: string | null;
  fax: string | null;
  email: string | null;
  deliveryEmail: string | null;
  contactName: string | null;
  address: Address;
  balanceCode: string | null;
  sortCode: string | null;
  openingBalance: Money;
}

/** Everything the edit form can change */
export type ClientChanges = Omit<Client, 'id'>;

export interface LedgerEntry {
  date: string;
  kind: 'openingBalance' | 'document' | 'payment';
  document: DocumentRef | null;
  /** ח: amounts the client owes */
  debit: Money;
  /** ז: amounts credited to the client */
  credit: Money;
  /** Running balance after this entry; positive means the client paid more than billed */
  balance: Money;
}

export interface Ledger {
  /** Newest first */
  entries: LedgerEntry[];
  balance: Money;
}

export const formatAddress = (address: Address) =>
  [
    [address.street, address.houseNumber].filter(Boolean).join(' '),
    address.city,
    address.zip,
    address.country,
  ]
    .filter(Boolean)
    .join(', ') || null;
