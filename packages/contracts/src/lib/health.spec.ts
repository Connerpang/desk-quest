import { healthResponseSchema } from './health';

describe('healthResponseSchema', () => {
  it('accepts a readiness response', () => {
    expect(
      healthResponseSchema.parse({
        status: 'error',
        checks: { database: 'down' },
      }),
    ).toEqual({ status: 'error', checks: { database: 'down' } });
  });

  it('rejects unknown statuses', () => {
    expect(healthResponseSchema.safeParse({ status: 'maybe' }).success).toBe(
      false,
    );
  });
});
