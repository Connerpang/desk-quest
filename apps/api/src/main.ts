import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app/app.module';
import {
  configureApp,
  createFastifyAdapter,
  GLOBAL_PREFIX,
} from './app/configure-app';
import { loadConfigOrExit } from './config/env';

async function bootstrap() {
  const config = loadConfigOrExit();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.forRoot(config),
    createFastifyAdapter(),
    { bufferLogs: true },
  );
  configureApp(app);
  await app.listen(config.PORT, config.HOST);
  // Set when Nx waits for this server to be ready
  if (process.env.NX_READY_SIGNAL_SOCKET) {
    try {
      // Function keeps TypeScript and bundlers from rewriting or bundling the import
      const load = new Function('s', 'return import(s)') as (
        s: string,
      ) => Promise<{ emitReadySignal(server: unknown): boolean }>;
      (await load('@nx/js/ready-signal')).emitReadySignal(app.getHttpServer());
    } catch {
      // @nx/js isn't installed
    }
  }
  app
    .get(Logger)
    .log(
      `API listening on http://${config.HOST}:${config.PORT}/${GLOBAL_PREFIX}/v1`,
    );
}

bootstrap();
