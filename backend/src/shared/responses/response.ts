export interface ApiResponseEnvelope<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, any>;
}

export class ResponseUtil {
  static success<T = any>(
    data: T,
    message: string = "Operation completed successfully",
    meta?: Record<string, any>
  ): ApiResponseEnvelope<T> {
    return {
      success: true,
      message,
      data,
      meta,
    };
  }

  static error(
    message: string = "An error occurred",
    meta?: Record<string, any>
  ): ApiResponseEnvelope<null> {
    return {
      success: false,
      message,
      data: null,
      meta,
    };
  }
}
