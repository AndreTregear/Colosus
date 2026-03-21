import { query, queryOne } from './pool.js';
import { createRowMapper, mergeFields, type Spec, type FieldSpec } from './row-mapper.js';

export interface RepoOptions<T> {
  table: string;
  spec: Spec<T>;
  primaryKey?: string;
  tenantColumn?: string;
  softDeleteColumn?: string;
}

export interface ListOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
}

// Valid SQL identifier: letters, digits, underscores only (prevents SQL injection via column names)
const SAFE_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function assertSafeIdentifier(name: string): void {
  if (!SAFE_IDENTIFIER.test(name)) {
    throw new Error(`Unsafe SQL identifier rejected: "${name}"`);
  }
}

function assertSafeOrderBy(orderBy: string): void {
  for (const part of orderBy.split(',')) {
    const trimmed = part.trim();
    if (!SAFE_IDENTIFIER.test(trimmed)) {
      throw new Error(`Unsafe ORDER BY rejected: "${orderBy}"`);
    }
  }
}

export class BaseRepository<T> {
  protected table: string;
  protected spec: Spec<T>;
  protected primaryKey: string;
  protected tenantColumn: string | null;
  protected softDeleteColumn: string | null;
  toEntity: (row: Record<string, unknown>) => T;
  protected columns: string[];

  constructor(options: RepoOptions<T>) {
    this.table = options.table;
    this.spec = options.spec;
    this.primaryKey = options.primaryKey ?? 'id';
    this.tenantColumn = options.tenantColumn ?? null;
    this.softDeleteColumn = options.softDeleteColumn ?? null;
    this.toEntity = createRowMapper<T>(options.spec);
    this.columns = Object.entries(options.spec as Record<string, FieldSpec>).map(([key, spec]) =>
      typeof spec === 'string' ? spec : (spec as { col: string }).col
    );
  }

  protected buildWhere(conditions: string[], tenantId?: string): { sql: string; params: unknown[] } {
    const params: unknown[] = [];
    const parts: string[] = [];

    if (tenantId && this.tenantColumn) {
      params.push(tenantId);
      parts.push(`${this.tenantColumn} = $${params.length}`);
    }

    if (this.softDeleteColumn) {
      parts.push(`${this.softDeleteColumn} != 'deleted'`);
    }

    for (const cond of conditions) {
      parts.push(cond);
    }

    return { sql: parts.length > 0 ? `WHERE ${parts.join(' AND ')}` : '', params };
  }

  async findAll(tenantId?: string, options: ListOptions = {}): Promise<T[]> {
    const { sql: whereSql, params } = this.buildWhere([], tenantId);
    const hasCreatedAt = 'createdAt' in (this.spec as Record<string, FieldSpec>);
    const orderBy = options.orderBy ?? (hasCreatedAt ? 'created_at' : this.primaryKey);
    assertSafeOrderBy(orderBy);
    const dir = options.orderDir ?? 'DESC';

    let sql = `SELECT * FROM ${this.table} ${whereSql} ORDER BY ${orderBy} ${dir}`;

    if (options.limit !== undefined) {
      params.push(options.limit);
      sql += ` LIMIT $${params.length}`;
    }
    if (options.offset !== undefined) {
      params.push(options.offset);
      sql += ` OFFSET $${params.length}`;
    }

    const result = await query<Record<string, unknown>>(sql, params);
    return result.rows.map(r => this.toEntity(r));
  }

  async findById(id: string | number, tenantId?: string): Promise<T | undefined> {
    const params: unknown[] = [id];
    let sql = `SELECT * FROM ${this.table} WHERE ${this.primaryKey} = $1`;
    
    if (tenantId && this.tenantColumn) {
      params.push(tenantId);
      sql += ` AND ${this.tenantColumn} = $${params.length}`;
    }

    const row = await queryOne<Record<string, unknown>>(sql, params);
    return row ? this.toEntity(row) : undefined;
  }

  async findByColumn<K extends keyof T>(column: string, value: T[K], tenantId?: string): Promise<T | undefined> {
    assertSafeIdentifier(column);
    const params: unknown[] = [value];
    let sql = `SELECT * FROM ${this.table} WHERE ${column} = $1`;
    
    if (tenantId && this.tenantColumn) {
      params.push(tenantId);
      sql += ` AND ${this.tenantColumn} = $${params.length}`;
    }

    const row = await queryOne<Record<string, unknown>>(sql, params);
    return row ? this.toEntity(row) : undefined;
  }

  async findManyByColumn<K extends keyof T>(column: string, value: T[K], tenantId?: string): Promise<T[]> {
    assertSafeIdentifier(column);
    const params: unknown[] = [value];
    let sql = `SELECT * FROM ${this.table} WHERE ${column} = $1`;
    
    if (tenantId && this.tenantColumn) {
      params.push(tenantId);
      sql += ` AND ${this.tenantColumn} = $${params.length}`;
    }

    const result = await query<Record<string, unknown>>(sql, params);
    return result.rows.map(r => this.toEntity(r));
  }

  async findOneByColumns(columns: Partial<Record<string, unknown>>, tenantId?: string): Promise<T | undefined> {
    const params: unknown[] = [];
    const parts: string[] = [];

    if (tenantId && this.tenantColumn) {
      params.push(tenantId);
      parts.push(`${this.tenantColumn} = $${params.length}`);
    }

    for (const [col, val] of Object.entries(columns)) {
      assertSafeIdentifier(col);
      params.push(val);
      parts.push(`${col} = $${params.length}`);
    }

    const where = parts.length > 0 ? `WHERE ${parts.join(' AND ')}` : '';
    const row = await queryOne<Record<string, unknown>>(`SELECT * FROM ${this.table} ${where} LIMIT 1`, params);
    return row ? this.toEntity(row) : undefined;
  }

  async findManyByColumns(columns: Partial<Record<string, unknown>>, tenantId?: string, options: ListOptions = {}): Promise<T[]> {
    const params: unknown[] = [];
    const parts: string[] = [];

    if (tenantId && this.tenantColumn) {
      params.push(tenantId);
      parts.push(`${this.tenantColumn} = $${params.length}`);
    }

    for (const [col, val] of Object.entries(columns)) {
      assertSafeIdentifier(col);
      params.push(val);
      parts.push(`${col} = $${params.length}`);
    }

    const where = parts.length > 0 ? `WHERE ${parts.join(' AND ')}` : '';
    const hasCreatedAt = 'createdAt' in (this.spec as Record<string, FieldSpec>);
    const orderBy = options.orderBy ?? (hasCreatedAt ? 'created_at' : this.primaryKey);
    assertSafeOrderBy(orderBy);
    const dir = options.orderDir ?? 'DESC';

    let sql = `SELECT * FROM ${this.table} ${where} ORDER BY ${orderBy} ${dir}`;
    if (options.limit !== undefined) {
      params.push(options.limit);
      sql += ` LIMIT $${params.length}`;
    }

    const result = await query<Record<string, unknown>>(sql, params);
    return result.rows.map(r => this.toEntity(r));
  }

  async count(tenantId?: string, extraConditions?: string[]): Promise<number> {
    for (const cond of extraConditions ?? []) {
      if (/['";]|--|\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b|\bEXEC\b/i.test(cond)) {
        throw new Error(`Unsafe SQL condition rejected: "${cond}"`);
      }
    }
    const { sql: whereSql, params } = this.buildWhere(extraConditions ?? [], tenantId);
    const row = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM ${this.table} ${whereSql}`, params);
    return Number(row?.count ?? 0);
  }

  async create(data: Partial<T>, tenantId?: string): Promise<T> {
    const entries = Object.entries(data).filter(([, v]) => v !== undefined);
    const columns = entries.map(([k]) => {
      const spec = this.spec[k as keyof T];
      return typeof spec === 'string' ? spec : spec?.col ?? k;
    });
    const values = entries.map(([, v]) => v);

    if (tenantId && this.tenantColumn && !columns.includes(this.tenantColumn)) {
      columns.unshift(this.tenantColumn);
      values.unshift(tenantId);
    }

    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;

    const row = await queryOne<Record<string, unknown>>(sql, values);
    if (!row) throw new Error(`Failed to create ${this.table}`);
    return this.toEntity(row);
  }

  async update(id: string | number, data: Partial<T>, tenantId?: string): Promise<T | undefined> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return undefined;

    const entries = Object.entries(data).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return existing;

    const params: unknown[] = [];
    const sets: string[] = [];

    for (const [key, value] of entries) {
      const spec = this.spec[key as keyof T];
      const col = typeof spec === 'string' ? spec : spec?.col ?? key;
      params.push(value);
      sets.push(`${col} = $${params.length}`);
    }

    params.push(id);
    let sql = `UPDATE ${this.table} SET ${sets.join(', ')}, updated_at = now() WHERE ${this.primaryKey} = $${params.length}`;
    
    if (tenantId && this.tenantColumn) {
      params.push(tenantId);
      sql += ` AND ${this.tenantColumn} = $${params.length}`;
    }
    sql += ' RETURNING *';

    const row = await queryOne<Record<string, unknown>>(sql, params);
    return row ? this.toEntity(row) : undefined;
  }

  async delete(id: string | number, tenantId?: string): Promise<boolean> {
    if (this.softDeleteColumn) {
      const params: unknown[] = [id];
      let sql = `UPDATE ${this.table} SET ${this.softDeleteColumn} = 'deleted', updated_at = now() WHERE ${this.primaryKey} = $1`;
      
      if (tenantId && this.tenantColumn) {
        params.push(tenantId);
        sql += ` AND ${this.tenantColumn} = $${params.length}`;
      }

      const result = await query(sql, params);
      return (result.rowCount ?? 0) > 0;
    } else {
      const params: unknown[] = [id];
      let sql = `DELETE FROM ${this.table} WHERE ${this.primaryKey} = $1`;
      
      if (tenantId && this.tenantColumn) {
        params.push(tenantId);
        sql += ` AND ${this.tenantColumn} = $${params.length}`;
      }

      const result = await query(sql, params);
      return (result.rowCount ?? 0) > 0;
    }
  }

  async exists(id: string | number, tenantId?: string): Promise<boolean> {
    const entity = await this.findById(id, tenantId);
    return entity !== undefined;
  }
}

export { createRowMapper, mergeFields, type Spec };
