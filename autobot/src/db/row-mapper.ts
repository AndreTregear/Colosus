/**
 * Generic row-to-type mapper — eliminates per-repo rowTo*() boilerplate.
 *
 * Usage:
 *   const rowToProduct = createRowMapper<Product>({
 *     id: 'id',
 *     tenantId: 'tenant_id',
 *     price: { col: 'price', type: 'number' },
 *     createdAt: { col: 'created_at', type: 'date' },
 *   });
 */

export type FieldSpec =
  | string                                              // simple column rename
  | { col: string; type: 'date' }                       // date → ISO string
  | { col: string; type: 'number' }                     // force Number()
  | { col: string; type: 'number?' }                    // nullable Number()
  | { col: string; type: 'json'; default?: unknown }    // JSON parse
  | { col: string; type: 'string'; default: string };   // string with default

export type Spec<T> = { [K in keyof T]: FieldSpec };

export function createRowMapper<T>(spec: Spec<T>): (row: Record<string, unknown>) => T {
  const keys = Object.keys(spec) as (keyof T)[];

  return (row: Record<string, unknown>): T => {
    const out = {} as Record<string, unknown>;
    for (const key of keys) {
      const field = spec[key];

      if (typeof field === 'string') {
        out[key as string] = row[field];
        continue;
      }

      const val = row[field.col];
      switch (field.type) {
        case 'date':
          out[key as string] = (val as Date)?.toISOString?.() ?? val;
          break;
        case 'number':
          out[key as string] = Number(val);
          break;
        case 'number?':
          out[key as string] = val != null ? Number(val) : null;
          break;
        case 'json': {
          const def = (field as { default?: unknown }).default;
          if (typeof val === 'string') {
            try {
              out[key as string] = JSON.parse(val);
            } catch {
              out[key as string] = def ?? null;
            }
          } else {
            out[key as string] = val ?? def ?? null;
          }
          break;
        }
        case 'string':
          out[key as string] = val ?? field.default;
          break;
      }
    }
    return out as unknown as T;
  };
}

/**
 * Merge partial input into an existing record.
 * Only fields where input[key] !== undefined overwrite existing values.
 */
export function mergeFields<T extends Record<string, unknown>>(
  existing: T,
  input: Partial<T>,
  fields: (keyof T)[],
): Pick<T, (typeof fields)[number]> {
  const result = {} as Record<string, unknown>;
  for (const key of fields) {
    result[key as string] = input[key] !== undefined ? input[key] : existing[key];
  }
  return result as Pick<T, (typeof fields)[number]>;
}
