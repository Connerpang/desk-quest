import { DynamicModule, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import type { DestinationStream } from 'pino';
import { ConfigModule } from '../config/config.module';
import { AppConfig } from '../config/env';
import { DatabaseModule } from '../database/database.module';
import { HealthModule } from '../health/health.module';
import {
  pinoHttpOptions,
  scrubbingDestination,
} from '../logging/logger.options';

export interface AppModuleOptions {
  /** Overrides stdout, e.g. to capture log output in tests. */
  logDestination?: DestinationStream;
}

@Module({})
export class AppModule {
  static forRoot(
    config: AppConfig,
    options: AppModuleOptions = {},
  ): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigModule.forRoot(config),
        LoggerModule.forRoot({
          pinoHttp: [
            pinoHttpOptions(config),
            scrubbingDestination(options.logDestination),
          ],
        }),
        DatabaseModule,
        HealthModule,
      ],
    };
  }
}
