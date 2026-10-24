import { describeError } from './errors';

describe('describeError', () => {
  it('describes an AggregateError by its inner errors', () => {
    const err = new AggregateError(
      [
        new Error('connect ECONNREFUSED ::1:5432'),
        new Error('connect ECONNREFUSED 127.0.0.1:5432'),
      ],
      '',
    );
    expect(describeError(err)).toBe(
      'connect ECONNREFUSED ::1:5432; connect ECONNREFUSED 127.0.0.1:5432',
    );
  });

  it('falls back to the error code when the message is empty', () => {
    expect(
      describeError(Object.assign(new Error(''), { code: 'ETIMEDOUT' })),
    ).toBe('ETIMEDOUT');
  });
});
