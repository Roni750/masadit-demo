import { describe, expect, it } from 'vitest';
import { toApiClientChanges, toClient } from './clients';

const rawClient = {
  id: 1,
  name: 'Air Dell',
  tax_id: '515555555',
  payment_terms: 'current_30' as const,
  is_active: true,
  phone: '03-5555555',
  mobile: null,
  fax: null,
  email: 'billing@airdell.example',
  delivery_email: null,
  contact_name: null,
  street: 'Herzl',
  house_number: '10',
  city: 'Tel Aviv',
  zip: null,
  po_box: null,
  country: null,
  balance_code: null,
  sort_code: null,
  opening_balance: '-25.50',
};

describe('clients adapter', () => {
  it('maps the API client to the domain model', () => {
    const client = toClient(rawClient);

    expect(client.paymentTerms).toBe('current30');
    expect(client.address).toEqual({
      street: 'Herzl',
      houseNumber: '10',
      city: 'Tel Aviv',
      zip: null,
      poBox: null,
      country: null,
    });
    expect(client.openingBalance).toEqual({ amount: -25.5, currency: 'ILS' });
  });

  it('round-trips a client back to the API shape for saving', () => {
    const expected: Partial<typeof rawClient> = { ...rawClient };
    delete expected.id;

    expect(toApiClientChanges(toClient(rawClient))).toEqual(expected);
  });
});
