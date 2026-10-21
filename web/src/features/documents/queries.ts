import { useMutation, useQuery, useQueryClient, type InfiniteData, type QueryClient } from '@tanstack/react-query';
import {
  cancelDocument,
  createAllocation,
  deleteAllocation,
  deleteDocument,
  fetchClosableDocuments,
  fetchClosingCandidates,
  fetchDocument,
} from '../../api/documents';
import { documentKeys } from '../../api/queryKeys';
import type { DocumentSummary, Paginated } from '../../domain/documents';

// The History list usually has this document cached already; showing it lets the
// detail screens render their header instantly while the full document loads
const findCachedSummary = (queryClient: QueryClient, id: number): DocumentSummary | undefined => {
  const lists = queryClient.getQueriesData<InfiniteData<Paginated<DocumentSummary>>>({
    queryKey: [...documentKeys.all, 'list'],
  });
  for (const [, data] of lists) {
    const match = data?.pages.flatMap((page) => page.items).find((document) => document.id === id);
    if (match) return match;
  }
  return undefined;
};

export const useDocument = (id: number) => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: ({ signal }) => fetchDocument(id, signal),
  });
  return { ...query, summary: query.data ?? findCachedSummary(queryClient, id) };
};

export const useClosingCandidates = (id: number) =>
  useQuery({
    queryKey: documentKeys.closingCandidates(id),
    queryFn: ({ signal }) => fetchClosingCandidates(id, signal),
  });

export const useClosableDocuments = (id: number) =>
  useQuery({
    queryKey: documentKeys.closable(id),
    queryFn: ({ signal }) => fetchClosableDocuments(id, signal),
  });

// Every write changes statuses, balances and totals that many cached queries show
// (lists, totals, details, candidates), so each one refreshes all documents queries on success
const useDocumentsMutation = <TVariables>(mutationFn: (variables: TVariables) => Promise<unknown>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  });
};

export const useAllocate = () =>
  useDocumentsMutation(({ targetId, closerId }: { targetId: number; closerId: number | null }) =>
    createAllocation(targetId, closerId),
  );

export const useRemoveAllocation = () => useDocumentsMutation((allocationId: number) => deleteAllocation(allocationId));

export const useCancelDocument = () => useDocumentsMutation((id: number) => cancelDocument(id));

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDocument(id),
    onSuccess: (_result, id) => {
      // The deleted document's own detail would only refetch into a 404 while the screen closes
      queryClient.removeQueries({ queryKey: documentKeys.detail(id) });
      return queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
};
