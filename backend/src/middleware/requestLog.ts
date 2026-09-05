import { Request, Response, NextFunction } from 'express';

// Lightweight structured request logging. Skips health checks and the test
// suite (CI output stays clean). Levels map from the response status so 5xx
// errors are greppable in prod logs.
export function requestLog(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'test' || req.path === '/health') return next();

  const start = Date.now();
  res.on('finish', () => {
    const status = res.statusCode;
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    const durationMs = Date.now() - start;
    console.log(`[req] ${level} ${req.method} ${req.originalUrl} ${status} ${durationMs}ms`);
  });
  next();
}
