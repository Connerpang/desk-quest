-- Runtime role privileges (spec §12.1, plan §5). Migrations run as
-- app_migrator, which owns every object. app_runtime gets DML only: it can't
-- create, alter or own objects, so RLS policies always apply to it.
-- The roles themselves are created outside migrations, by
-- deployment/compose/postgres/initdb/01-roles.sh or your DBA.
GRANT USAGE ON SCHEMA public TO app_runtime;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;
