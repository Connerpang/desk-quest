import { Type } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { AppModule, AppModuleOptions } from '../app/app.module';
import { configureApp, createFastifyAdapter } from '../app/configure-app';
import { AppConfig, envSchema } from '../config/env';

// Port 1 refuses connections immediately: a database that is "down".
export const UNREACHABLE_DATABASE_URL =
  'postgres://deskquest:deskquest@127.0.0.1:1/deskquest';

export function testConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return envSchema.parse({
    NODE_ENV: 'test',
    DATABASE_URL: UNREACHABLE_DATABASE_URL,
    LOG_LEVEL: 'silent',
    ...overrides,
  });
}

export interface TestAppOptions extends AppModuleOptions {
  config?: AppConfig;
  controllers?: Type[];
  overrides?: { provide: symbol; useValue: unknown }[];
}

export async function createTestApp(
  options: TestAppOptions = {},
): Promise<NestFastifyApplication> {
  const config = options.config ?? testConfig();
  let builder = Test.createTestingModule({
    imports: [AppModule.forRoot(config, options)],
    controllers: options.controllers ?? [],
  });
  for (const { provide, useValue } of options.overrides ?? []) {
    builder = builder.overrideProvider(provide).useValue(useValue);
  }
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    createFastifyAdapter(),
    { bufferLogs: true },
  );
  configureApp(app);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}
