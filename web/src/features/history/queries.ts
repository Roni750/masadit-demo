import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useQuery, type QueryClient } from '@tanstack/react-query';
import { fetchDocuments, fetchTypeTotals } from '../../api/documents';
import { documentKeys } from '../../api/queryKeys';
import type { DocumentFilter } from '../../domain/documents';

const PAGE_SIZE = 20;

const documentsQuery = (filter: DocumentFilter) =>
  infiniteQueryOptions({
    queryKey: documentKeys.list(filter),
    queryFn: ({ pageParam, signal }) => fetchDocuments(filter, pageParam, PAGE_SIZE, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });

const typeTotalsQuery = (filter: Omit<DocumentFilter, 'type'>) =>
  queryOptions({
    queryKey: documentKeys.typeTotals(filter),
    queryFn: ({ signal }) => fetchTypeTotals(filter, signal),
  });

export const useDocuments = (filter: DocumentFilter) => useInfiniteQuery(documentsQuery(filter));

export const useTypeTotals = (filter: Omit<DocumentFilter, 'type'>) => useQuery(typeTotalsQuery(filter));

// Called on touch-down of a filter, so the request is usually done by the time the tap completes.
// A no-op while that filter's data is still fresh in the cache.
export const prefetchDocuments = (queryClient: QueryClient, filter: DocumentFilter) =>
  queryClient.prefetchInfiniteQuery(documentsQuery(filter));
