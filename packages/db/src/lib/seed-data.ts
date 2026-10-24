import type { NewTenant, NewUser } from '../schema';

// Synthetic demo data only. Emails use the reserved example.com domain
// (RFC 2606) so seeding can never mail or identify a real person.
export const seedTenants: NewTenant[] = [
  { name: 'Demo Company', slug: 'demo' },
];

export const seedUsers: NewUser[] = [
  { email: 'admin@example.com', displayName: 'Curious Otter' },
  { email: 'employee@example.com', displayName: 'Brave Badger' },
];
