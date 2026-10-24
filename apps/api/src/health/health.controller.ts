import {
  Controller,
  Get,
  Inject,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { HealthResponse } from '@deskquest/contracts';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';

const DB_PING_TIMEOUT_MS = 2000;

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Get('live')
  live(): HealthResponse {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready(): Promise<HealthResponse> {
    const database = (await this.pingDatabase()) ? 'up' : 'down';
    if (database === 'down') {
      throw new ServiceUnavailableException({
        status: 'error',
        checks: { database },
      } satisfies HealthResponse);
    }
    return { status: 'ok', checks: { database } };
  }

  private async pingDatabase(): Promise<boolean> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })),
        DB_PING_TIMEOUT_MS,
      );
    });
    try {
      await Promise.race([this.pool.query('SELECT 1'), timeout]);
      return true;
    } catch (err) {
      // Only the error code: driver messages can include connection details.
      const code = (err as { code?: string }).code ?? 'unknown';
      this.logger.warn(
        `Readiness check failed: database unreachable (${code})`,
      );
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}
