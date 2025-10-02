import { Request, Response, NextFunction } from 'express';
import { z, ZodObject, ZodError } from 'zod';

export const validate =
  (schema: ZodObject) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });
        return next();
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            error: 'Validation failed',
            details: z.treeifyError(error),
          });
        }
        return next(error);
      }
    };
