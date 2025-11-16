import { Request } from 'express';

export interface PageParams {
  page: number;
  limit: number;
  skip: number;
}

export function getPageParams(req: Request): PageParams {
  const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '20', 10), 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildPaginated<T>(docs: T[], total: number, page: number, limit: number) {
  return {
    data: docs,
    page,
    limit,
    totalItems: total,
    totalPages: Math.ceil(total / limit)
  };
}
