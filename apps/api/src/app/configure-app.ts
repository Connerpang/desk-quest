import { VersioningType } from '@nestjs/common';
import type { IncomingMessage } from 'node:http';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { resolveRequestId } from '../logging/request-id';

export const GLOBAL_PREFIX = 'api';

export function createFastifyAdapter(): FastifyAdapter {
  // pino-http picks up Fastify's request ID, so it is generated here.
  const adapter = new FastifyAdapter({
    genReqId: (req: IncomingMessage) =>
      resolveRequestId(req.headers['x-request-id']),
  });
  adapter.getInstance().addHook('onRequest', (request, reply, done) => {
    reply.header('x-request-id', request.id);
    done();
  });
  return adapter;
}

/** Shared by main.ts and tests so both serve the same routes and logger. */
export function configureApp(app: NestFastifyApplication): void {
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.enableShutdownHooks();
}
