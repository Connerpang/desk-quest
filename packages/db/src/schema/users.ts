import { sql } from 'drizzle-orm';
import {
  check,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { timestamps } from './columns';

export const userStatus = pgEnum('user_status', ['active', 'disabled']);

// docs/privacy/data-inventory.md §1: email and alias are the only personal
// data on a user. Auth secrets live in separate tables (slice 1.1).
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    status: userStatus('status').notNull().default('active'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('users_email_key').on(sql`lower(${t.email})`),
    check('users_email_length', sql`char_length(${t.email}) between 3 and 254`),
    check(
      'users_display_name_length',
      sql`char_length(${t.displayName}) between 1 and 50`,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
