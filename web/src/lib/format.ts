import type { Money } from '../domain/documents';

export const formatMoney = (money: Money, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(money.amount);

// Dates arrive as 'YYYY-MM-DD' calendar dates; formatting in UTC keeps the day from shifting
export const formatDate = (isoDate: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );
