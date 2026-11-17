import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DevAuthGuard } from '../auth/dev-auth.guard';
import { FileLogService } from '../log/file-log.service';

type LogEntry = {
  ts?: string;
  level?: string;
  message?: string;
  data?: unknown;
};

/**
 * Recibe los eventos que el frontend registra (requests/responses del chat,
 * acciones del usuario) y los persiste en logs/frontend.log.
 */
@Controller('logs')
@UseGuards(DevAuthGuard)
export class LogsController {
  constructor(private readonly fileLog: FileLogService) {}

  @Post()
  push(@Body() body: { entries?: LogEntry[] }): { written: number } {
    const entries = Array.isArray(body?.entries) ? body.entries : [];
    for (const entry of entries) {
      this.fileLog.write(
        'frontend.log',
        JSON.stringify({
          ts:
            typeof entry?.ts === 'string' ? entry.ts : new Date().toISOString(),
          level: typeof entry?.level === 'string' ? entry.level : 'log',
          message: typeof entry?.message === 'string' ? entry.message : '',
          data: entry?.data,
        }),
      );
    }
    return { written: entries.length };
  }
}
