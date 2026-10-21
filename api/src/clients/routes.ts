import { Router } from 'express';
import { z } from 'zod';
import { notFound } from '../http/errors.js';
import type { ClientsRepository } from './repository.js';
import { PAYMENT_TERMS } from './types.js';

const idSchema = z.object({ id: z.coerce.number().int().positive() });

// Optional text field: trimmed, and an empty string clears it (stored as null)
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .optional();

const updateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    tax_id: optionalText(20),
    payment_terms: z.enum(PAYMENT_TERMS).optional(),
    is_active: z.boolean().optional(),
    phone: optionalText(30),
    mobile: optionalText(30),
    fax: optionalText(30),
    email: z.email().max(200).nullable().optional().or(z.literal('').transform(() => null)),
    delivery_email: z.email().max(200).nullable().optional().or(z.literal('').transform(() => null)),
    contact_name: optionalText(200),
    street: optionalText(200),
    house_number: optionalText(20),
    city: optionalText(100),
    zip: optionalText(20),
    po_box: optionalText(20),
    country: optionalText(100),
    balance_code: optionalText(50),
    sort_code: optionalText(50),
    opening_balance: z
      .string()
      .regex(/^-?\d{1,10}(\.\d{1,2})?$/, 'must be an amount with up to 2 decimals')
      .optional(),
  })
  .strict();

export const createClientsRouter = (clients: ClientsRepository) => {
  const router = Router();

  router.get('/:id', async (req, res) => {
    const { id } = idSchema.parse(req.params);
    const client = await clients.findById(id);
    if (!client) throw notFound(`Client ${id} not found`);
    res.json(client);
  });

  router.patch('/:id', async (req, res) => {
    const { id } = idSchema.parse(req.params);
    const changes = updateSchema.parse(req.body ?? {});
    const client = await clients.update(id, changes);
    if (!client) throw notFound(`Client ${id} not found`);
    res.json(client);
  });

  router.get('/:id/ledger', async (req, res) => {
    const { id } = idSchema.parse(req.params);
    const client = await clients.findById(id);
    if (!client) throw notFound(`Client ${id} not found`);
    const entries = await clients.ledger(id);
    res.json({ entries, balance: entries.at(-1)?.balance ?? '0.00' });
  });

  return router;
};
