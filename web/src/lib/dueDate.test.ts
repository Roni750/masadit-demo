import { describe, expect, it } from 'vitest';
import { dueDate } from './dueDate';

describe('dueDate', () => {
  it.each([
    ['immediate', '2026-10-19', '2026-10-19'],
    ['current', '2026-10-19', '2026-10-31'],
    ['current30', '2026-10-19', '2026-11-30'],
    ['current60', '2026-10-19', '2026-12-30'],
    ['current90', '2026-12-05', '2027-03-31'],
    // February in a leap year
    ['current', '2028-02-10', '2028-02-29'],
  ] as const)('%s from %s is due %s', (terms, issuedAt, expected) => {
    expect(dueDate(issuedAt, terms)).toBe(expected);
  });
});
