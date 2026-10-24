import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { PG_POOL } from '../database/database.module';
import { createTestApp } from '../testing/create-test-app';

describe('HealthController', () => {
  describe('with the database down', () => {
    let app: NestFastifyApplication;

    beforeAll(async () => {
      app = await createTestApp();
    });

    afterAll(async () => {
      await app.close();
    });

    it('GET /api/v1/health/live returns 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/health/live',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ status: 'ok' });
    });

    it('GET /api/v1/health/ready returns 503', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/health/ready',
      });
      expect(res.statusCode).toBe(503);
      expect(res.json()).toEqual({
        status: 'error',
        checks: { database: 'down' },
      });
    });
  });

  describe('with the database up', () => {
    let app: NestFastifyApplication;

    beforeAll(async () => {
      const pool = { query: vi.fn().mockResolvedValue({}), end: vi.fn() };
      app = await createTestApp({
        overrides: [{ provide: PG_POOL, useValue: pool }],
      });
    });

    afterAll(async () => {
      await app.close();
    });

    it('GET /api/v1/health/ready returns 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/health/ready',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ status: 'ok', checks: { database: 'up' } });
    });
  });
});
