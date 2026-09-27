import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";

const SENSITIVE_KEYS = /password|token|secret|authorization|ciphertext/i;

export function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_KEYS.test(key) ? "[REDACTED]" : redactSensitive(entry),
    ]),
  );
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method?: string;
      originalUrl?: string;
      url?: string;
      headers?: Record<string, unknown>;
      body?: unknown;
    }>();
    const startedAt = Date.now();
    console.log(JSON.stringify({
      event: "request",
      method: request.method,
      path: request.originalUrl ?? request.url,
      headers: redactSensitive(request.headers),
      body: redactSensitive(request.body),
    }));
    return next.handle().pipe(
      tap(() => {
        console.log(JSON.stringify({
          event: "response",
          method: request.method,
          path: request.originalUrl ?? request.url,
          durationMs: Date.now() - startedAt,
        }));
      }),
    );
  }
}
