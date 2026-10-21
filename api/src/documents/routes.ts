import { Router } from 'express';
import { z } from 'zod';
import { notFound } from '../http/errors.js';
import type { DocumentsRepository } from './repository.js';
import { DOCUMENT_TYPES } from './types.js';

const filterSchema = z.object({
  status: z.enum(['open', 'closed']).optional(),
  client_id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(100).optional(),
});

const listSchema = filterSchema.extend({
  type: z.enum(DOCUMENT_TYPES).optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(50).default(20),
});

const idSchema = z.object({ id: z.coerce.number().int().positive() });

const allocationSchema = z.object({
  // null (or omitted) means a manual close
  closing_document_id: z.number().int().positive().nullable().default(null),
});

export const createDocumentsRouter = (documents: DocumentsRepository) => {
  const router = Router();

  const requireDocument = async (id: number) => {
    const document = await documents.findById(id);
    if (!document) throw notFound(`Document ${id} not found`);
    return document;
  };

  router.get('/', async (req, res) => {
    const query = listSchema.parse(req.query);
    const page = await documents.list(
      { type: query.type, status: query.status, clientId: query.client_id, search: query.search },
      query.page,
      query.page_size,
    );
    res.json(page);
  });

  router.get('/type-totals', async (req, res) => {
    const query = filterSchema.parse(req.query);
    const totals = await documents.typeTotals({
      status: query.status,
      clientId: query.client_id,
      search: query.search,
    });
    res.json({ items: totals });
  });

  router.get('/:id', async (req, res) => {
    const { id } = idSchema.parse(req.params);
    res.json(await requireDocument(id));
  });

  router.get('/:id/closing-candidates', async (req, res) => {
    const { id } = idSchema.parse(req.params);
    res.json({ items: await documents.closingCandidates(await requireDocument(id)) });
  });

  router.get('/:id/closable', async (req, res) => {
    const { id } = idSchema.parse(req.params);
    res.json({ items: await documents.closableBy(await requireDocument(id)) });
  });

  router.post('/:id/allocations', async (req, res) => {
    const { id } = idSchema.parse(req.params);
    const body = allocationSchema.parse(req.body ?? {});
    const allocation = await documents.allocate(id, body.closing_document_id);
    res.status(201).json(allocation);
  });

  router.post('/:id/cancel', async (req, res) => {
    const { id } = idSchema.parse(req.params);
    await documents.cancel(id);
    res.status(204).end();
  });

  router.delete('/:id', async (req, res) => {
    const { id } = idSchema.parse(req.params);
    await documents.softDelete(id);
    res.status(204).end();
  });

  return router;
};

export const createAllocationsRouter = (documents: DocumentsRepository) => {
  const router = Router();

  router.delete('/:id', async (req, res) => {
    const { id } = idSchema.parse(req.params);
    await documents.removeAllocation(id);
    res.status(204).end();
  });

  return router;
};
