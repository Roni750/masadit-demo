import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

// Every error response has the shape { error: { code, message } }
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (message: string) => new HttpError(404, 'not_found', message);

// A valid request that the current state of the data doesn't allow (e.g. closing a closed document)
export const conflict = (code: string, message: string) => new HttpError(409, code, message);

export const routeNotFound: RequestHandler = (req, _res, next) => {
  next(notFound(`No route for ${req.method} ${req.path}`));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  if (error instanceof ZodError) {
    const message = error.issues.map((issue) => `${issue.path.join('.') || 'input'}: ${issue.message}`).join('; ');
    res.status(400).json({ error: { code: 'invalid_request', message } });
    return;
  }
  console.error(error);
  res.status(500).json({ error: { code: 'internal', message: 'Something went wrong' } });
};
