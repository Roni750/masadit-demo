import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchClient, fetchLedger, updateClient } from '../../api/clients';
import { clientKeys, documentKeys } from '../../api/queryKeys';
import type { ClientChanges } from '../../domain/clients';

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

export const useUpdateClient = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: ClientChanges) => updateClient(id, changes),
    onSuccess: (client) => {
      // The response is the saved client: show it right away instead of refetching it
      queryClient.setQueryData(clientKeys.detail(id), client);
      // Document cards and lists show the client's name, so those refresh too
      return queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
};
