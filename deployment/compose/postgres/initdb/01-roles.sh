#!/bin/sh
# Runs once, when the Postgres volume is first initialised.
# Creates the two application roles (spec §12.1, plan §5):
#   app_migrator  owns the database and every schema object; runs migrations
#   app_runtime   used by the API; DML only, never owns objects, no BYPASSRLS
# Grants on tables come from migrations/0000_runtime_role_grants.sql.
set -eu

for name in APP_MIGRATOR_PASSWORD APP_RUNTIME_PASSWORD; do
  if [ -z "$(printenv "$name")" ]; then
    echo "$name must be set" >&2
    exit 1
  fi
done

psql -v ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v dbname="$POSTGRES_DB" \
  -v migrator_password="$APP_MIGRATOR_PASSWORD" \
  -v runtime_password="$APP_RUNTIME_PASSWORD" <<'SQL'
CREATE ROLE app_migrator LOGIN PASSWORD :'migrator_password'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE app_runtime LOGIN PASSWORD :'runtime_password'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;

-- The database owner also owns schema public (pg_database_owner).
ALTER DATABASE :"dbname" OWNER TO app_migrator;
REVOKE ALL ON DATABASE :"dbname" FROM PUBLIC;
GRANT CONNECT ON DATABASE :"dbname" TO app_runtime;
SQL
