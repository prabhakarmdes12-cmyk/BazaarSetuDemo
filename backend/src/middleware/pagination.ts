import { Request } from 'express';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export interface Pagination {
  limit: number;
  offset: number;
}

export function getPagination(req: Request): Pagination {
  const rawLimit = parseInt(req.query.limit as string, 10);
  const rawOffset = parseInt(req.query.offset as string, 10);

  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT;
  const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? rawOffset : 0;

  return { limit, offset };
}
