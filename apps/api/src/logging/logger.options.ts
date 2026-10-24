import type { IncomingMessage } from 'node:http';
import pino, { DestinationStream } from 'pino';
import type { Options } from 'pino-http';
import { AppConfig } from '../config/env';

// docs/privacy/data-inventory.md §2.2: these keys never reach log output.
const SENSITIVE_KEYS = [
  'email',
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'cookie',
  'authorization',
  'ip',
  'remoteAddress',
];
const SENSITIVE_HEADERS = ['set-cookie', 'x-forwarded-for', 'x-real-ip'];

export const REDACT_PATHS = [
  ...SENSITIVE_KEYS.flatMap((key) => [key, `*.${key}`, `*.*.${key}`]),
  ...SENSITIVE_HEADERS.flatMap((header) => [
    `*["${header}"]`,
    `*.*["${header}"]`,
  ]),
];

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

export function scrubText(text: string): string {
  return text.replace(EMAIL_PATTERN, '[REDACTED_EMAIL]');
}

/**
 * Last line of defence: scrubs emails from each serialized log line, which
 * also covers free-text messages and error messages that key-based redaction
 * cannot see.
 */
export function scrubbingDestination(
  destination: DestinationStream = pino.destination({ fd: 1, sync: true }),
): DestinationStream {
  return { write: (line: string) => destination.write(scrubText(line)) };
}

function pathOnly(url: string | undefined): string | undefined {
  // Query strings can carry magic-link tokens or emails.
  return url?.split('?')[0];
}

export function pinoHttpOptions(config: AppConfig): Options {
  return {
    level: config.LOG_LEVEL,
    autoLogging: {
      // Fastify middleware sees a rewritten req.url; originalUrl is the full path.
      ignore: (req: IncomingMessage & { originalUrl?: string }) =>
        pathOnly(req.originalUrl ?? req.url)?.startsWith('/api/v1/health/') ??
        false,
    },
    // Allow-list serializers: no headers, bodies, query strings or IPs.
    serializers: {
      req: (req: { id: unknown; method: string; url: string }) => ({
        id: req.id,
        method: req.method,
        url: pathOnly(req.url),
      }),
      res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
    },
    redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
  };
}
