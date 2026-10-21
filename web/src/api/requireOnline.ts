import { onlineManager } from '@tanstack/react-query';
import { ApiError } from './http';

// For writes that change the books (closing documents, cancel, delete): these must never be queued
// offline and replayed later, so while offline they fail at once with code 'offline'.
// Use with networkMode: 'always', otherwise TanStack would pause the mutation instead of running this check.
export const requireOnline =
  <TVariables, TResult>(write: (variables: TVariables) => Promise<TResult>) =>
  (variables: TVariables) => {
    if (!onlineManager.isOnline()) {
      return Promise.reject(new ApiError(0, 'offline', 'This action needs an internet connection'));
    }
    return write(variables);
  };
