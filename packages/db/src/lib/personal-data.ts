// docs/privacy/data-inventory.md §2.1: a migration must not add a column
// whose name looks like personal data unless the inventory lists it.
// Short patterns match whole name segments only, so "ip" flags `ip_address`
// but not `membership_id` or `description`.
const SEGMENT_PATTERNS = ['ip', 'dob', 'lat', 'lng', 'ssn'];
const SUBSTRING_PATTERNS = [
  'phone',
  'birth',
  'address',
  'gender',
  'photo',
  'location',
  'passport',
  'salary',
];

export interface AddedColumn {
  file: string;
  table: string;
  column: string;
}

export function looksPersonal(column: string): boolean {
  const name = column.toLowerCase();
  const segments = name.split('_');
  return (
    SUBSTRING_PATTERNS.some((pattern) => name.includes(pattern)) ||
    SEGMENT_PATTERNS.some((pattern) =>
      segments.some(
        (segment) => segment === pattern || segment === `${pattern}s`,
      ),
    )
  );
}

/** `table.column` references written in backticks in the inventory. */
export function inventoryColumns(inventory: string): Set<string> {
  const refs = inventory.matchAll(/`([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)`/g);
  return new Set([...refs].map(([, table, column]) => `${table}.${column}`));
}

const IDENT = String.raw`(?:"[^"]+"|[A-Za-z_][\w$]*)`;
const QUALIFIED = String.raw`(?:${IDENT}\s*\.\s*)?(${IDENT})`;
const TABLE_CONSTRAINT =
  /^(constraint|primary|unique|check|foreign|exclude|like)\b/i;

function unquote(identifier: string): string {
  return identifier.startsWith('"')
    ? identifier.slice(1, -1)
    : identifier.toLowerCase();
}

function stripComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ');
}

/** Splits on commas that are not nested inside parentheses or quotes. */
function splitTopLevel(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = '';
  for (const char of body) {
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === "'" || char === '"') {
      quote = char;
    } else if (char === '(') {
      depth++;
    } else if (char === ')') {
      depth--;
    } else if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

/** Text between the parenthesis at `open` and its matching close. */
function balancedBody(sql: string, open: number): string {
  let depth = 0;
  for (let i = open; i < sql.length; i++) {
    if (sql[i] === '(') depth++;
    if (sql[i] === ')' && --depth === 0) return sql.slice(open + 1, i);
  }
  return sql.slice(open + 1);
}

/**
 * Columns introduced by CREATE TABLE, ALTER TABLE … ADD [COLUMN] and
 * ALTER TABLE … RENAME [COLUMN] … TO. A deliberately simple parser for the
 * SQL drizzle-kit emits and for hand-written migrations in the same style.
 */
export function addedColumns(file: string, rawSql: string): AddedColumn[] {
  const sql = stripComments(rawSql);
  const found: AddedColumn[] = [];

  const createTable = new RegExp(
    String.raw`create\s+(?:unlogged\s+|temp(?:orary)?\s+)?table\s+(?:if\s+not\s+exists\s+)?${QUALIFIED}\s*\(`,
    'gi',
  );
  for (const match of sql.matchAll(createTable)) {
    const table = unquote(match[1]);
    const body = balancedBody(sql, match.index + match[0].length - 1);
    for (const item of splitTopLevel(body)) {
      if (TABLE_CONSTRAINT.test(item)) continue;
      const column = item.match(new RegExp(`^${IDENT}`));
      if (column) found.push({ file, table, column: unquote(column[0]) });
    }
  }

  const alterTable = new RegExp(
    String.raw`alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?${QUALIFIED}([^;]*)`,
    'gi',
  );
  for (const match of sql.matchAll(alterTable)) {
    const table = unquote(match[1]);
    const actions = match[2];
    const add = new RegExp(
      String.raw`\badd\s+(?:column\s+)?(?:if\s+not\s+exists\s+)?(${IDENT})`,
      'gi',
    );
    for (const action of actions.matchAll(add)) {
      if (
        /^(constraint|primary|unique|check|foreign|exclude)$/i.test(action[1])
      )
        continue;
      found.push({ file, table, column: unquote(action[1]) });
    }
    const rename = new RegExp(
      String.raw`\brename\s+(?:column\s+)?${IDENT}\s+to\s+(${IDENT})`,
      'gi',
    );
    for (const action of actions.matchAll(rename)) {
      found.push({ file, table, column: unquote(action[1]) });
    }
  }

  return found;
}

export function findPersonalDataColumns(
  migrations: { file: string; sql: string }[],
  inventory: string,
): AddedColumn[] {
  const allowed = inventoryColumns(inventory);
  return migrations
    .flatMap(({ file, sql }) => addedColumns(file, sql))
    .filter(
      ({ table, column }) =>
        looksPersonal(column) && !allowed.has(`${table}.${column}`),
    );
}
