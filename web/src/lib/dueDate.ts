import type { PaymentTerms } from '../domain/clients';

const EXTRA_DAYS: Record<PaymentTerms, number | null> = {
  immediate: null,
  current: 0,
  current30: 30,
  current60: 60,
  current90: 90,
};

// Israeli "שוטף + N" terms: due N days after the end of the month the document was issued in.
// "Immediate" is due on the issue date. Works on 'YYYY-MM-DD' calendar dates, in UTC to avoid timezone shifts.
export const dueDate = (issuedAt: string, terms: PaymentTerms): string => {
  const extraDays = EXTRA_DAYS[terms];
  if (extraDays === null) return issuedAt;

  const issued = new Date(`${issuedAt}T00:00:00Z`);
  const endOfMonth = new Date(Date.UTC(issued.getUTCFullYear(), issued.getUTCMonth() + 1, 0));
  endOfMonth.setUTCDate(endOfMonth.getUTCDate() + extraDays);
  return endOfMonth.toISOString().slice(0, 10);
};
