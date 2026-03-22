import pg from 'pg';
import { DATABASE_URL } from '../config.js';
import { logger } from '../shared/logger.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    const poolConfig = {
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      statement_timeout: 10000,
      query_timeout: 15000,
      allowExitOnIdle: true,
    };
    logger.debug({ ...poolConfig, dbHost: DATABASE_URL.replace(/\/\/.*:.*@/, '//***:***@') }, 'Creating PG connection pool');

    pool = new Pool({
      connectionString: DATABASE_URL,
      ...poolConfig,
    });

    pool.on('error', (err) => {
      logger.error({ err: err.message }, 'Unexpected pg pool error');
    });

    pool.on('connect', () => {
      logger.debug({ totalCount: pool!.totalCount, idleCount: pool!.idleCount, waitingCount: pool!.waitingCount }, 'PG pool: new connection');
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function query<T extends pg.QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return getPool().query<T>(text, params);
}

export async function queryOne<T extends pg.QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const result = await getPool().query<T>(text, params);
  return result.rows[0] ?? null;
}

export async function transaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
