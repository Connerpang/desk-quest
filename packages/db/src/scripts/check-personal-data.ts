import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { findPersonalDataColumns } from '../lib/personal-data';

const MIGRATIONS_DIR = 'migrations';
const INVENTORY = '../../docs/privacy/data-inventory.md';

const migrations = readdirSync(MIGRATIONS_DIR)
  .filter((file) => file.endsWith('.sql'))
  .sort()
  .map((file) => ({
    file,
    sql: readFileSync(join(MIGRATIONS_DIR, file), 'utf8'),
  }));
const problems = findPersonalDataColumns(
  migrations,
  readFileSync(INVENTORY, 'utf8'),
);

if (problems.length > 0) {
  process.stderr.write(
    'Personal-data column check failed. These columns look like personal data\n' +
      'but are not listed in docs/privacy/data-inventory.md:\n' +
      problems
        .map(({ file, table, column }) => `  - ${table}.${column} (${file})`)
        .join('\n') +
      '\nRemove the column, or document it in the inventory as `table.column`\n' +
      'with a reason and get it reviewed (data-inventory §1).\n',
  );
  process.exit(1);
}
process.stdout.write(
  `Personal-data column check passed (${migrations.length} migrations).\n`,
);
