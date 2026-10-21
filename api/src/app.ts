import cors from 'cors';
import express from 'express';
import type { ClientsRepository } from './clients/repository.js';
import { createClientsRouter } from './clients/routes.js';
import { config } from './config.js';
import type { DocumentsRepository } from './documents/repository.js';
import { createAllocationsRouter, createDocumentsRouter } from './documents/routes.js';
import { errorHandler, routeNotFound } from './http/errors.js';

export interface AppDependencies {
  documents: DocumentsRepository;
  clients: ClientsRepository;
}

// Repositories are injected so tests can run the real routes against in-memory fakes
export const createApp = ({ documents, clients }: AppDependencies) => {
  const app = express();

  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/documents', createDocumentsRouter(documents));
  app.use('/allocations', createAllocationsRouter(documents));
  app.use('/clients', createClientsRouter(clients));

  app.use(routeNotFound);
  app.use(errorHandler);

  return app;
};
