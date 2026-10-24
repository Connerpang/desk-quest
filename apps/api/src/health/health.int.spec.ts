import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { startTestDatabase, TestDatabase } from '@deskquest/test-utils';
import { createTestApp, testConfig } from '../testing/create-test-app';

describe('readiness against a real database', () => {
  let db: TestDatabase;
  let app: NestFastifyApplication;

  beforeAll(async () => {
    db = await startTestDatabase();
    app = await createTestApp({
      config: testConfig({ DATABASE_URL: db.runtimeUrl }),
    });
  });

  afterAll(async () => {
    await app?.close();
    await db?.stop();
  });

  it('GET /api/v1/health/ready returns 200 as app_runtime', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/health/ready',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', checks: { database: 'up' } });
  });
});
