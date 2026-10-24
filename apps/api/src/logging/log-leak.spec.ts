import { randomBytes } from 'node:crypto';
import { Body, Controller, Logger, Post } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createTestApp, testConfig } from '../testing/create-test-app';

// Fresh random values each run: the test can't pass by accident, and the
// file contains no secret-looking literals.
const fake = () => randomBytes(12).toString('hex');
const EMAIL = 'alice.leak@example.com';
const PASSWORD = fake();
const TOKEN = fake();
const COOKIE_VALUE = fake();
const CLIENT_IP = '203.0.113.77';

// Simulates careless application code that logs what it receives.
@Controller('leaky')
class LeakyController {
  private readonly logger = new Logger('Leaky');

  @Post()
  handle(@Body() body: Record<string, unknown>) {
    this.logger.log({ body }, `sign-in attempt for ${EMAIL}`);
    this.logger.warn({ user: { email: EMAIL, token: TOKEN } });
    throw new Error(`lookup failed for ${EMAIL}`);
  }
}

describe('log redaction (data-inventory §2.2)', () => {
  let app: NestFastifyApplication;
  const lines: string[] = [];

  beforeAll(async () => {
    app = await createTestApp({
      config: testConfig({ LOG_LEVEL: 'trace' }),
      controllers: [LeakyController],
      logDestination: { write: (line: string) => lines.push(line) },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('never writes emails, secrets, cookies or IPs to the log', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/leaky?email=${encodeURIComponent(EMAIL)}&token=${TOKEN}`,
      headers: {
        authorization: `Bearer ${TOKEN}`,
        cookie: `session=${COOKIE_VALUE}`,
        'x-forwarded-for': CLIENT_IP,
        'x-request-id': 'leak-test-1',
      },
      payload: { email: EMAIL, password: PASSWORD, nested: { token: TOKEN } },
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(res.statusCode).toBe(500);
    expect(res.headers['x-request-id']).toBe('leak-test-1');

    const output = lines.join('');
    // Guard against a vacuous pass: the request and the app logs were written.
    expect(output).toContain('leak-test-1');
    expect(output).toContain('sign-in attempt for [REDACTED_EMAIL]');
    expect(output).toContain('/api/v1/leaky');

    for (const secret of [
      EMAIL,
      encodeURIComponent(EMAIL),
      PASSWORD,
      TOKEN,
      COOKIE_VALUE,
      CLIENT_IP,
      '127.0.0.1',
    ]) {
      expect(output).not.toContain(secret);
    }
  });

  it('does not access-log health checks', async () => {
    lines.length = 0;
    await app.inject({
      method: 'GET',
      url: '/api/v1/health/live',
      headers: { 'x-request-id': 'health-probe-1' },
    });
    await new Promise((resolve) => setImmediate(resolve));
    expect(lines.join('')).not.toContain('health-probe-1');
  });

  it('replaces an invalid incoming request ID with a generated one', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/health/live',
      headers: { 'x-request-id': `${EMAIL} <script>` },
    });
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });
});
