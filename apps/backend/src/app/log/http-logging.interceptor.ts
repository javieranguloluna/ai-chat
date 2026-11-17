import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { FileLogService } from './file-log.service';

/** Registra cada petición HTTP que procesa el backend en logs/backend.log. */
@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly fileLog: FileLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.registrar(context, start),
        error: () => this.registrar(context, start),
      }),
    );
  }

  private registrar(context: ExecutionContext, start: number): void {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    this.fileLog.write(
      'backend.log',
      [
        new Date().toISOString(),
        req.method,
        req.url,
        `-> ${res.statusCode}`,
        `(${Date.now() - start}ms)`,
      ].join(' '),
    );
  }
}
