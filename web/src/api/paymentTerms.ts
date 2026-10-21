import type { PaymentTerms } from '../domain/clients';

export type ApiPaymentTerms = 'immediate' | 'current' | 'current_30' | 'current_60' | 'current_90';

export const TERMS_FROM_API: Record<ApiPaymentTerms, PaymentTerms> = {
  immediate: 'immediate',
  current: 'current',
  current_30: 'current30',
  current_60: 'current60',
  current_90: 'current90',
};

export const TERMS_TO_API = Object.fromEntries(
  Object.entries(TERMS_FROM_API).map(([api, domain]) => [domain, api]),
) as Record<PaymentTerms, ApiPaymentTerms>;
