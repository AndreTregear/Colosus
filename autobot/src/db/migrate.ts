import fs from 'node:fs';
import path from 'node:path';
import { getPool } from './pool.js';
import { logger } from '../shared/logger.js';

/**
 * Run all SQL schema files on startup.
 * All statements use IF NOT EXISTS / are idempotent, so re-running is safe.
 *
 * Execution order:
 *   1. schema.sql          — base tables (user, tenants, etc.) — MUST run first
 *   2. schema-*.sql        — extension schemas (alphabetical)
 *   3. seed-plans.sql      — seed data (depends on subscription tables)
 */
export async function runDatabaseMigrations(): Promise<void> {
  const pool = getPool();
  const baseDir = process.cwd();

  // Match schema.sql and any schema-*.sql (including multiple hyphens like schema-000-base.sql)
  const allSchemaFiles = fs.readdirSync(baseDir).filter(f => /^schema[\w-]*\.sql$/.test(f));

  // schema.sql MUST run first — it creates base tables (tenants, etc.) that others depend on
  const baseSchema = allSchemaFiles.includes('schema.sql') ? ['schema.sql'] : [];
  const extensionSchemas = allSchemaFiles.filter(f => f !== 'schema.sql').sort();

  const schemaFiles = [...baseSchema, ...extensionSchemas, 'seed-plans.sql'];

  logger.info({ files: schemaFiles }, 'Running database migrations');

  for (const file of schemaFiles) {
    const filePath = path.join(baseDir, file);
    if (!fs.existsSync(filePath)) continue;

    const sql = fs.readFileSync(filePath, 'utf-8');
    try {
      await pool.query(sql);
      logger.info({ filename: file }, 'Applied schema');
    } catch (err) {
      logger.error({ err, filename: file }, 'Schema apply failed');
      throw err;
    }
  }

  logger.info('Database schema applied successfully');
}
