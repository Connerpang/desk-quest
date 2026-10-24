import {
  Global,
  Inject,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { createDb } from '@deskquest/db';
import { Pool } from 'pg';
import { APP_CONFIG } from '../config/config.module';
import { AppConfig } from '../config/env';

export const PG_POOL = Symbol('PG_POOL');
export const DB = Symbol('DB');

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => {
        // Connects lazily, so the API starts (and reports not-ready) while
        // the database is down.
        const pool = new Pool({
          connectionString: config.DATABASE_URL,
          connectionTimeoutMillis: 2000,
        });
        pool.on('error', (err: Error & { code?: string }) => {
          new Logger('Database').warn(
            `Idle database client error (${err.code ?? 'unknown'})`,
          );
        });
        return pool;
      },
    },
    { provide: DB, inject: [PG_POOL], useFactory: createDb },
  ],
  exports: [PG_POOL, DB],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
