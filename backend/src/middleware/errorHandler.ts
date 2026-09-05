import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  const isProd = process.env.NODE_ENV === 'production';
  console.error('[error]', err.message, isProd ? '' : `\n${err.stack || ''}`);
  res.status(500).json({
    success: false,
    message: isProd ? 'Something went wrong' : err.message || 'Internal server error',
  });
}
