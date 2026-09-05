import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues || [];
        const messages = issues.map((e) => `${String(e.path.join('.'))}: ${e.message}`);
        return res.status(400).json({
          success: false,
          message: messages.join(', '),
          errors: issues,
        });
      }
      next(err);
    }
  };
}
