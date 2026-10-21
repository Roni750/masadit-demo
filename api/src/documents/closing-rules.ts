import type { DocumentType } from './types.js';

// Which document types can close (fully or partly) a document of a given type.
// E.g. a tax invoice is closed by the credit invoices or receipts issued against it,
// and a quote is closed by the order or invoice it turned into.
export const CLOSING_TYPES: Record<DocumentType, DocumentType[]> = {
  quote: ['order', 'deal_invoice', 'tax_invoice', 'tax_invoice_receipt'],
  order: ['deal_invoice', 'tax_invoice', 'tax_invoice_receipt', 'delivery_note'],
  deal_invoice: ['tax_invoice', 'tax_invoice_receipt', 'receipt'],
  smart_invoice: ['credit_invoice', 'receipt'],
  tax_invoice: ['credit_invoice', 'receipt'],
  tax_invoice_receipt: ['credit_invoice'],
  delivery_note: ['tax_invoice', 'tax_invoice_receipt'],
  credit_invoice: [],
  receipt: [],
  self_invoice: [],
};

// Closers whose own balance is used up when applied (money moving), as opposed to
// documents that close a target by converting it (a quote turning into an invoice).
// Mirrored in the document_summaries view (db/migrations/002_closing.sql).
export const CONSUMING_CLOSER_TYPES: DocumentType[] = ['credit_invoice', 'receipt'];

export const canClose = (closer: DocumentType, target: DocumentType) => CLOSING_TYPES[target].includes(closer);

// The inverse of CLOSING_TYPES: which types a document of this type can close
export const closableTypes = (closer: DocumentType) =>
  (Object.keys(CLOSING_TYPES) as DocumentType[]).filter((target) => canClose(closer, target));
