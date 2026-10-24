import { loadConfigOrExit, parseEnv } from './env';

const DATABASE_URL = 'postgres://app@db.internal:5432/deskquest';

describe('parseEnv', () => {
  it('applies defaults to a minimal valid environment', () => {
    expect(parseEnv({ DATABASE_URL })).toEqual({
      success: true,
      config: {
        NODE_ENV: 'development',
        HOST: 'localhost',
        PORT: 3000,
        DATABASE_URL,
        LOG_LEVEL: 'info',
        SMTP_PORT: 587,
        SMTP_SECURE: false,
        SMTP_FROM: 'deskquest@localhost.localdomain',
      },
    });
  });

  it('coerces PORT from a string', () => {
    const result = parseEnv({ DATABASE_URL, PORT: '8080' });
    expect(result.success && result.config.PORT).toBe(8080);
  });

  it('treats empty SMTP values from Compose as unset', () => {
    const result = parseEnv({
      DATABASE_URL,
      SMTP_HOST: 'mailpit',
      SMTP_PORT: '1025',
      SMTP_USER: '',
      SMTP_PASSWORD: '',
      SMTP_SECURE: '',
    });
    expect(result.success && result.config).toMatchObject({
      SMTP_HOST: 'mailpit',
      SMTP_PORT: 1025,
      SMTP_SECURE: false,
      SMTP_USER: undefined,
      SMTP_PASSWORD: undefined,
    });
  });

  it('rejects a malformed SMTP_FROM', () => {
    const result = parseEnv({ DATABASE_URL, SMTP_FROM: 'not-an-email' });
    expect(!result.success && result.message).toContain('SMTP_FROM:');
  });

  it('reports a missing DATABASE_URL clearly', () => {
    const result = parseEnv({});
    expect(result).toEqual({
      success: false,
      message:
        'Invalid environment configuration:\n  - DATABASE_URL: is required\n',
    });
  });

  it('rejects a non-postgres DATABASE_URL without echoing its value', () => {
    const result = parseEnv({ DATABASE_URL: 'mysql://u:hunter2@h/db' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toContain(
        'DATABASE_URL: must be a postgres:// or postgresql:// URL',
      );
      expect(result.message).not.toContain('hunter2');
    }
  });

  it('lists every invalid variable', () => {
    const result = parseEnv({ PORT: '70000', LOG_LEVEL: 'loud' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toMatch(/PORT:/);
      expect(result.message).toMatch(/LOG_LEVEL:/);
      expect(result.message).toMatch(/DATABASE_URL: is required/);
    }
  });
});

describe('loadConfigOrExit', () => {
  it('writes the message to stderr and exits with code 1', () => {
    const write = vi.fn();
    const exit = vi.fn((code: number): never => {
      throw new Error(`exit ${code}`);
    });
    expect(() => loadConfigOrExit({}, exit, write)).toThrow('exit 1');
    expect(write).toHaveBeenCalledWith(
      expect.stringContaining('DATABASE_URL: is required'),
    );
  });

  it('returns the config when valid', () => {
    const exit = vi.fn((): never => {
      throw new Error('unexpected exit');
    });
    expect(loadConfigOrExit({ DATABASE_URL }, exit).DATABASE_URL).toBe(
      DATABASE_URL,
    );
  });
});
