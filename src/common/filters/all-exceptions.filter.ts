import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";

type Response = {
  status: (code: number) => Response;
  json: (body: unknown) => void;
};

export type SanitizedError = {
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
};

export function sanitizeException(
  exception: unknown,
  path: string,
  isProduction = Deno.env.get("NODE_ENV") === "production",
): SanitizedError {
  const statusCode = exception instanceof HttpException
    ? exception.getStatus()
    : HttpStatus.INTERNAL_SERVER_ERROR;
  const response = exception instanceof HttpException
    ? exception.getResponse()
    : undefined;
  const rawMessage = typeof response === "string"
    ? response
    : response && typeof response === "object" &&
        "message" in response
    ? (response as { message?: unknown }).message
    : exception instanceof Error
    ? exception.message
    : "Internal server error";
  return {
    statusCode,
    message: isProduction && statusCode >= 500
      ? "Internal server error"
      : typeof rawMessage === "string" || Array.isArray(rawMessage)
      ? rawMessage as string | string[]
      : "Request failed",
    timestamp: new Date().toISOString(),
    path,
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<{ url?: string }>();
    const response = context.getResponse<Response>();
    const status = sanitizeException(exception, request.url ?? "/");
    response.status(status.statusCode).json(status);
  }
}

export class HttpExceptionFilter extends AllExceptionsFilter {}
