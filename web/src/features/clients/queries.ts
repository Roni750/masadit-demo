import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchClient, fetchLedger, updateClient } from '../../api/clients';
import { clientKeys, documentKeys } from '../../api/queryKeys';
import type { Client, ClientChanges } from '../../domain/clients';

export const useClient = (id: number) =>
  useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: ({ signal }) => fetchClient(id, signal),
  });

export const useLedger = (clientId: number) =>
  useQuery({
    queryKey: documentKeys.ledger(clientId),
    queryFn: ({ signal }) => fetchLedger(clientId, signal),
  });

// Client edits change no accounting records, so they're allowed offline: TanStack pauses the
// request (networkMode 'online', the default) and sends it once the connection returns.
// The change shows immediately (optimistic update) and is rolled back if the server rejects it.
// The queue lives in memory only (DECISIONS.md #11), so closing the app before reconnecting drops it.
export const useUpdateClient = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: ClientChanges) => updateClient(id, changes),
    onMutate: async (changes) => {
      await queryClient.cancelQueries({ queryKey: clientKeys.detail(id) });
      const previous = queryClient.getQueryData<Client>(clientKeys.detail(id));
      queryClient.setQueryData<Client>(clientKeys.detail(id), { ...changes, id });
      return { previous };
    },
    onError: (_error, _changes, context) => {
      if (context?.previous) queryClient.setQueryData(clientKeys.detail(id), context.previous);
    },
    onSuccess: (client) => {
      // The response is the saved client: show it right away instead of refetching it
      queryClient.setQueryData(clientKeys.detail(id), client);
      // Document cards and lists show the client's name, so those refresh too
      return queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
};
