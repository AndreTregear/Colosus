-- ═══════════════════════════════════════════════════════════════
-- Initialize all databases for the Yaya Platform stack.
-- This runs automatically on first PostgreSQL start via
-- docker-entrypoint-initdb.d/
-- ═══════════════════════════════════════════════════════════════

-- Create additional databases for OSS services
SELECT 'CREATE DATABASE calcom_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'calcom_db')\gexec
SELECT 'CREATE DATABASE lago_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lago_db')\gexec
SELECT 'CREATE DATABASE metabase_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'metabase_db')\gexec

-- Create Cal.com user (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'calcom') THEN
    CREATE ROLE calcom WITH LOGIN PASSWORD 'calcom_s3cur3';
  END IF;
END $$;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE calcom_db TO calcom;
GRANT ALL PRIVILEGES ON DATABASE lago_db TO yaya_prod;
GRANT ALL PRIVILEGES ON DATABASE metabase_db TO yaya_prod;

-- Connect to calcom_db and grant schema permissions
\c calcom_db
GRANT ALL ON SCHEMA public TO calcom;

-- Connect to metabase_db and grant schema permissions
\c metabase_db
GRANT CREATE ON SCHEMA public TO yaya_prod;

-- Connect back to main database for schema initialization
\c yaya

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
