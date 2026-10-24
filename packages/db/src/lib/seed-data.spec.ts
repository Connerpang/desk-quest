import { seedTenants, seedUsers } from './seed-data';

describe('seed data', () => {
  it('uses only reserved example domains for emails', () => {
    for (const user of seedUsers) {
      expect(user.email).toMatch(/@example\.(com|org|net)$/);
    }
  });

  it('fits the column constraints', () => {
    for (const tenant of seedTenants) {
      expect(tenant.slug).toMatch(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/);
      expect(tenant.name.length).toBeLessThanOrEqual(100);
    }
    for (const user of seedUsers) {
      expect(user.displayName.length).toBeLessThanOrEqual(50);
    }
  });

  it('has unique emails ignoring case', () => {
    const emails = seedUsers.map((u) => u.email.toLowerCase());
    expect(new Set(emails).size).toBe(emails.length);
  });
});
