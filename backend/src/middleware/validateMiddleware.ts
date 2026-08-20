import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import { ApiResponse } from '../utils/apiResponse';

export const validate = (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error: any) {
    const formattedErrors = error?.errors
      ? error.errors.map((e: any) => ({
          field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
          message: e.message,
        }))
      : [{ message: error.message || 'Validation error' }];

    return ApiResponse.error(
      res,
      'Validation failed: Invalid request payload',
      formattedErrors,
      400,
      'VALIDATION_ERROR',
      'check_input'
    );
  }
};
