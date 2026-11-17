import { Injectable, Logger } from '@nestjs/common';
import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Localiza el directorio de logs: `<raíz del workspace>/logs` (buscando
 * nx.json hacia arriba), con fallback al cwd del proceso.
 */
function resolveLogsDir(): string {
  let dir = process.cwd();
  for (let nivel = 0; nivel < 6; nivel++) {
    if (existsSync(join(dir, 'nx.json'))) return join(dir, 'logs');
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return join(process.cwd(), 'logs');
}

const LOGS_DIR = resolveLogsDir();

/**
 * Persistencia de logs en archivos dentro de `logs/` del workspace.
 * Ninguno de estos logs va a consola.
 */
@Injectable()
export class FileLogService {
  private readonly logger = new Logger(FileLogService.name);

  write(file: string, content: string): void {
    try {
      mkdirSync(LOGS_DIR, { recursive: true });
      appendFileSync(
        join(LOGS_DIR, file),
        content.endsWith('\n') ? content : `${content}\n`,
      );
    } catch (error) {
      this.logger.error(`No se pudo escribir logs/${file}: ${error}`);
    }
  }
}
