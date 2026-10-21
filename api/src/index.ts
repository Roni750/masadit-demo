import { createApp } from './app.js';
import { createPgClientsRepository } from './clients/repository.js';
import { config } from './config.js';
import { pool } from './db/pool.js';
import { createPgDocumentsRepository } from './documents/repository.js';

const app = createApp({
  documents: createPgDocumentsRepository(pool),
  clients: createPgClientsRepository(pool),
});

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
