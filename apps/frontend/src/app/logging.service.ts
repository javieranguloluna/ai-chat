import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

export type LogEntry = {
  ts: string;
  level: 'log' | 'error';
  message: string;
  data?: unknown;
};

const FLUSH_DELAY_MS = 500;
const MAX_BODY_LOG_CHARS = 20_000;

/**
 * Registro de todo lo que procesa el front. Acumula entradas en un buffer
 * y las envía al backend (`POST /api/logs`), que las persiste en
 * logs/frontend.log. El propio envío de logs no se registra (evita bucles).
 */
@Injectable({ providedIn: 'root' })
export class LoggingService {
  private readonly auth = inject(AuthService);
  private readonly buffer: LogEntry[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  log(message: string, data?: unknown): void {
    this.push('log', message, data);
  }

  error(message: string, data?: unknown): void {
    this.push('error', message, data);
  }

  private push(
    level: LogEntry['level'],
    message: string,
    data?: unknown,
  ): void {
    this.buffer.push({ ts: new Date().toISOString(), level, message, data });
    if (this.buffer.length > 100) void this.flush();
    else this.timer ??= setTimeout(() => void this.flush(), FLUSH_DELAY_MS);
  }

  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (!this.buffer.length) return;
    const entries = this.buffer.splice(0);
    void fetch('/api/logs', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.auth.token}`,
      },
      body: JSON.stringify({ entries }),
      keepalive: true,
    }).catch(() => {
      // Sin logging remoto disponible: no se reintenta para no saturar.
    });
  }

  /** Trunca payloads grandes (p. ej. el stream completo del chat). */
  static truncar(valor: unknown, max = MAX_BODY_LOG_CHARS): unknown {
    if (typeof valor !== 'string') return valor;
    return valor.length > max ? valor.slice(0, max) + '…[truncado]' : valor;
  }
}
