import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  addedColumns,
  findPersonalDataColumns,
  inventoryColumns,
  looksPersonal,
} from './personal-data';

const INVENTORY =
  'Stored in `users.email` and `memberships.show_to_coworkers`.';

describe('looksPersonal', () => {
  it.each([
    'phone',
    'phone_number',
    'mobilephone',
    'date_of_birth',
    'dob',
    'ip',
    'last_ip',
    'ip_address',
    'home_address',
    'gender',
    'photo_url',
    'lat',
    'lng',
    'ssn',
    'passport_no',
    'salary',
    'location',
  ])('flags %s', (column) => {
    expect(looksPersonal(column)).toBe(true);
  });

  it.each([
    'id',
    'tenant_id',
    'membership_id',
    'description',
    'zip_enabled',
    'slug',
    'email',
    'relationship',
    'latest_version',
  ])('allows %s', (column) => {
    expect(looksPersonal(column)).toBe(false);
  });
});

describe('addedColumns', () => {
  it('reads columns from CREATE TABLE and skips table constraints', () => {
    const sql = `CREATE TABLE "users" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "display_name" text NOT NULL,
      "kind" text DEFAULT 'a,b' NOT NULL,
      CONSTRAINT "users_len" CHECK (char_length("users"."display_name") between 1 and 50)
    );`;
    expect(addedColumns('0001.sql', sql).map((c) => c.column)).toEqual([
      'id',
      'display_name',
      'kind',
    ]);
  });

  it('reads ALTER TABLE ADD and RENAME, ignoring ADD CONSTRAINT', () => {
    const sql = `ALTER TABLE "public"."users" ADD COLUMN "phone" text;
      ALTER TABLE users ADD CONSTRAINT users_fk FOREIGN KEY (x) REFERENCES t(id);
      ALTER TABLE ONLY offices ADD lat numeric, ADD COLUMN IF NOT EXISTS lng numeric;
      ALTER TABLE users RENAME COLUMN notes TO home_address;`;
    expect(addedColumns('0002.sql', sql)).toEqual([
      { file: '0002.sql', table: 'users', column: 'phone' },
      { file: '0002.sql', table: 'offices', column: 'lat' },
      { file: '0002.sql', table: 'offices', column: 'lng' },
      { file: '0002.sql', table: 'users', column: 'home_address' },
    ]);
  });

  it('ignores commented-out statements', () => {
    const sql = `-- ALTER TABLE users ADD COLUMN phone text;
      /* ALTER TABLE users ADD COLUMN gender text; */`;
    expect(addedColumns('0003.sql', sql)).toEqual([]);
  });
});

describe('findPersonalDataColumns', () => {
  it('fails a migration that adds a phone column', () => {
    const problems = findPersonalDataColumns(
      [
        {
          file: '0002_add_phone.sql',
          sql: 'ALTER TABLE "users" ADD COLUMN "phone" text;',
        },
      ],
      INVENTORY,
    );
    expect(problems).toEqual([
      { file: '0002_add_phone.sql', table: 'users', column: 'phone' },
    ]);
  });

  it('allows a matching column that the inventory lists', () => {
    expect(
      findPersonalDataColumns(
        [{ file: 'x.sql', sql: 'ALTER TABLE users ADD COLUMN phone text;' }],
        'Phone is stored in `users.phone` because …',
      ),
    ).toEqual([]);
  });

  it('reads table.column references from the inventory', () => {
    expect(inventoryColumns(INVENTORY)).toEqual(
      new Set(['users.email', 'memberships.show_to_coworkers']),
    );
  });

  it('passes for the real migrations', () => {
    const dir = join(import.meta.dirname, '../../migrations');
    const migrations = readdirSync(dir)
      .filter((file) => file.endsWith('.sql'))
      .map((file) => ({ file, sql: readFileSync(join(dir, file), 'utf8') }));
    expect(migrations.length).toBeGreaterThan(0);
    expect(findPersonalDataColumns(migrations, '')).toEqual([]);
  });
});
