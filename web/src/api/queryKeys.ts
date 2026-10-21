import type { DocumentFilter } from '../domain/documents';

// Every documents query starts with 'documents', so a write can refresh them all at once with
// queryClient.invalidateQueries({ queryKey: documentKeys.all }). See DECISIONS.md #4.
export const documentKeys = {
  all: ['documents'] as const,
  list: (filter: DocumentFilter) => ['documents', 'list', filter] as const,
  typeTotals: (filter: Omit<DocumentFilter, 'type'>) => ['documents', 'typeTotals', filter] as const,
  detail: (id: number) => ['documents', 'detail', id] as const,
  closingCandidates: (id: number) => ['documents', 'closingCandidates', id] as const,
  closable: (id: number) => ['documents', 'closable', id] as const,
  // Derived from the client's documents, so it lives under 'documents' and refreshes with them
  ledger: (clientId: number) => ['documents', 'ledger', clientId] as const,
};

export const clientKeys = {
  all: ['clients'] as const,
  detail: (id: number) => ['clients', 'detail', id] as const,
};
