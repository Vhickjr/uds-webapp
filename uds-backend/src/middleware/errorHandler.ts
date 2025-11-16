import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('[ERR]', err);
  if (res.headersSent) return; // already sent
  const status = err.status || 500;
  res.status(status).json({ success: false, message: err.message || 'Server error' });
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
