import { Response } from 'express';

export class ApiResponse {
  static success<T>(res: Response, message: string, data: T = {} as T, metaOrStatusCode?: any, statusCode: number = 200) {
    let meta: any = undefined;
    let code = statusCode;

    if (typeof metaOrStatusCode === 'number') {
      code = metaOrStatusCode;
    } else if (metaOrStatusCode && typeof metaOrStatusCode === 'object') {
      meta = metaOrStatusCode;
    }

    return res.status(code).json({
      success: true,
      message,
      data,
      ...(meta ? { meta } : {})
    });
  }

  static error(
    res: Response,
    message: string,
    errors: any[] = [],
    statusCode: number = 400,
    errorCode?: string,
    actionHint?: string
  ) {
    const code = errorCode || (statusCode === 401 ? 'UNAUTHORIZED' : statusCode === 403 ? 'FORBIDDEN' : statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR');
    const action = actionHint || (statusCode === 401 ? 'login' : statusCode === 403 ? 'contact_admin' : 'retry');

    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      error: {
        code,
        message,
        action
      }
    });
  }
}
