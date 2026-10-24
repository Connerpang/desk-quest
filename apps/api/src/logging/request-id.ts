import { randomUUID } from 'node:crypto';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;

/** Reuses a well-formed incoming X-Request-ID, otherwise generates one. */
export function resolveRequestId(header: string | string[] | undefined) {
  return typeof header === 'string' && REQUEST_ID_PATTERN.test(header)
    ? header
    : randomUUID();
}
