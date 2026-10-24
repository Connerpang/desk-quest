import { z } from 'zod';

// Compose passes unset variables as empty strings; treat those as unset.
const unsetIfEmpty = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema);

const required = (expected: string) => (issue: { input?: unknown }) =>
  issue.input === undefined ? 'is required' : `must be ${expected}`;

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  HOST: z.string().min(1).default('localhost'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    error: required('a postgres:// or postgresql:// URL'),
  }),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  // Outgoing mail for magic links and invites (slice 1.1). Mailpit in dev.
  SMTP_HOST: unsetIfEmpty(z.string().min(1).optional()),
  SMTP_PORT: unsetIfEmpty(
    z.coerce.number().int().min(1).max(65535).default(587),
  ),
  SMTP_SECURE: unsetIfEmpty(
    z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
  ),
  SMTP_USER: unsetIfEmpty(z.string().optional()),
  SMTP_PASSWORD: unsetIfEmpty(z.string().optional()),
  SMTP_FROM: unsetIfEmpty(z.email().default('deskquest@localhost.localdomain')),
});

export type AppConfig = z.infer<typeof envSchema>;

export type EnvResult =
  { success: true; config: AppConfig } | { success: false; message: string };

/**
 * Validates the environment. Error messages name the offending variable but
 * never echo its value, since values such as DATABASE_URL contain secrets.
 */
export function parseEnv(env: Record<string, string | undefined>): EnvResult {
  const result = envSchema.safeParse(env);
  if (result.success) {
    return { success: true, config: result.data };
  }
  const lines = result.error.issues.map(
    (issue) => `  - ${issue.path.join('.')}: ${issue.message}`,
  );
  return {
    success: false,
    message: `Invalid environment configuration:\n${lines.join('\n')}\n`,
  };
}

export function loadConfigOrExit(
  env: Record<string, string | undefined> = process.env,
  exit: (code: number) => never = (code) => process.exit(code),
  write: (message: string) => void = (message) => process.stderr.write(message),
): AppConfig {
  const result = parseEnv(env);
  if (!result.success) {
    write(result.message);
    return exit(1);
  }
  return result.config;
}
