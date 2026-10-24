/**
 * A one-line description for script output. Connecting to "localhost" tries
 * IPv6 and IPv4, and Node reports that as an AggregateError with no message.
 */
export function describeError(err: unknown): string {
  if (err instanceof AggregateError && err.errors.length > 0) {
    return [...new Set(err.errors.map(describeError))].join('; ');
  }
  if (err instanceof Error) {
    return err.message || (err as { code?: string }).code || err.name;
  }
  return String(err);
}
