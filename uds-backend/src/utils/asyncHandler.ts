import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler so a rejected promise reaches Express's error
 * middleware via next(err) instead of becoming an unhandled rejection.
 *
 * Express 4 does not await route handlers or catch their rejections (that
 * only arrived in Express 5) — without this wrapper, an async handler that
 * throws (e.g. `throw new ApiError(401, 'Invalid credentials')`) crashes the
 * whole process for every in-flight request, not just the one that failed.
 */
export const asyncHandler =
  <Req extends Request = Request>(
    fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req as Req, res, next)).catch(next);
  };
