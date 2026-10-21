import { config } from '../config';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

type QueryValue = string | number | undefined;

const buildUrl = (path: string, query?: Record<string, QueryValue>) => {
  const url = new URL(path, config.apiUrl);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  return url;
};

const request = async <T>(url: URL, init: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.error?.code ?? 'unknown',
      body?.error?.message ?? `Request failed with status ${response.status}`,
    );
  }
  return body as T;
};

export const getJson = <T>(path: string, query?: Record<string, QueryValue>, signal?: AbortSignal) =>
  request<T>(buildUrl(path, query), { signal });

export const sendJson = <T>(method: 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown) =>
  request<T>(buildUrl(path), {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
