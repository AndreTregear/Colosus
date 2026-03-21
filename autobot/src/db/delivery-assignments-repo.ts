import { query, queryOne } from './pool.js';
import { createRowMapper } from './row-mapper.js';
import type { DeliveryAssignment } from '../shared/types.js';
import type { DeliveryAssignmentRow } from './row-types.js';

const rowToAssignment = createRowMapper<DeliveryAssignment>({
  id: 'id',
  tenantId: 'tenant_id',
  orderId: { col: 'order_id', type: 'number' },
  riderId: { col: 'rider_id', type: 'number' },
  status: 'status',
  assignedAt: { col: 'assigned_at', type: 'date' },
  pickedUpAt: { col: 'picked_up_at', type: 'date' },
  deliveredAt: { col: 'delivered_at', type: 'date' },
  notes: 'notes',
});

export async function createAssignment(
  tenantId: string,
  orderId: number,
  riderId: number,
  notes?: string,
): Promise<DeliveryAssignment> {
  const row = await queryOne<DeliveryAssignmentRow>(
    `INSERT INTO delivery_assignments (tenant_id, order_id, rider_id, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [tenantId, orderId, riderId, notes || null],
  );
  return rowToAssignment(row!);
}

export async function getAssignmentByOrder(tenantId: string, orderId: number): Promise<DeliveryAssignment | undefined> {
  const row = await queryOne<DeliveryAssignmentRow>(
    `SELECT * FROM delivery_assignments
     WHERE tenant_id = $1 AND order_id = $2
     ORDER BY assigned_at DESC LIMIT 1`,
    [tenantId, orderId],
  );
  return row ? rowToAssignment(row) : undefined;
}

export async function updateAssignmentStatus(
  tenantId: string,
  id: number,
  status: string,
): Promise<DeliveryAssignment | undefined> {
  const timestampCol = status === 'picked_up' ? 'picked_up_at' : status === 'delivered' ? 'delivered_at' : null;
  const sql = timestampCol
    ? `UPDATE delivery_assignments SET status = $1, ${timestampCol} = now() WHERE tenant_id = $2 AND id = $3 RETURNING *`
    : `UPDATE delivery_assignments SET status = $1 WHERE tenant_id = $2 AND id = $3 RETURNING *`;

  const row = await queryOne<DeliveryAssignmentRow>(sql, [status, tenantId, id]);
  return row ? rowToAssignment(row) : undefined;
}

export async function getActiveAssignmentsByRider(tenantId: string, riderId: number): Promise<DeliveryAssignment[]> {
  const result = await query<DeliveryAssignmentRow>(
    `SELECT * FROM delivery_assignments
     WHERE tenant_id = $1 AND rider_id = $2 AND status NOT IN ('delivered', 'cancelled')
     ORDER BY assigned_at DESC`,
    [tenantId, riderId],
  );
  return result.rows.map(rowToAssignment);
}
