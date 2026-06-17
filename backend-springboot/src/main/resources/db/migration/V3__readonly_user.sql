-- V3: Read-only user for AI service (spec §7.3)
-- The password is overridden at runtime via POSTGRES_READONLY_PASSWORD env var;
-- this migration uses a placeholder that must be changed before production use.
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'readonly_user') THEN
        CREATE USER readonly_user WITH PASSWORD 'changeme_readonly_pw';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE inventory TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;
