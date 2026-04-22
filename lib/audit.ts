import 'server-only';
import { prisma } from './prisma';

export type AuditActionType =
  | 'CREATE_SHIPMENT'
  | 'UPDATE_SHIPMENT'
  | 'DELETE_SHIPMENT'
  | 'ADD_SHIPMENT_EVENT'
  | 'UPDATE_LEAD_STATUS'
  | 'DELETE_LEAD'
  | 'CREATE_CONTRACT'
  | 'DELETE_CONTRACT'
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'DELETE_TASK'
  | 'CREATE_BLOG'
  | 'UPDATE_BLOG'
  | 'DELETE_BLOG'
  | 'CREATE_TARIFF'
  | 'UPDATE_TARIFF'
  | 'DELETE_TARIFF'
  | 'CREATE_INVOICE'
  | 'UPDATE_INVOICE'
  | 'DELETE_INVOICE'
  | 'SEND_INVOICE'
  | 'PAY_INVOICE'
  | 'EXPORT_DATA'
  | 'CREATE_PARTNER'
  | 'UPDATE_PARTNER'
  | 'DELETE_PARTNER'
  | 'UPDATE_WAGON_STATUS'
  | 'UPDATE_WAGON_LOCATION'
  | 'REASSIGN_WAGON'
  | 'ASSIGN_WAGON'
  | 'SLA_VIOLATION';

const POINTS_MAP: Record<AuditActionType, number> = {
  CREATE_SHIPMENT: 5,
  UPDATE_SHIPMENT: 2,
  DELETE_SHIPMENT: 1,
  ADD_SHIPMENT_EVENT: 3,
  UPDATE_LEAD_STATUS: 2,
  DELETE_LEAD: 1,
  CREATE_CONTRACT: 5,
  DELETE_CONTRACT: 1,
  CREATE_TASK: 2,
  UPDATE_TASK: 1,
  DELETE_TASK: 1,
  CREATE_BLOG: 3,
  UPDATE_BLOG: 1,
  DELETE_BLOG: 1,
  CREATE_TARIFF: 3,
  UPDATE_TARIFF: 1,
  DELETE_TARIFF: 1,
  CREATE_INVOICE: 5,
  UPDATE_INVOICE: 2,
  DELETE_INVOICE: 1,
  SEND_INVOICE: 3,
  PAY_INVOICE: 4,
  EXPORT_DATA: 1,
  CREATE_PARTNER: 2,
  UPDATE_PARTNER: 1,
  DELETE_PARTNER: 1,
  UPDATE_WAGON_STATUS: 2,
  UPDATE_WAGON_LOCATION: 1,
  REASSIGN_WAGON: 1,
  ASSIGN_WAGON: 3,
  SLA_VIOLATION: -3,
};

export async function logAudit(
  userId: number | null | undefined,
  actionType: AuditActionType,
  description: string,
): Promise<void> {
  if (!userId) return;
  try {
    await prisma.userAction.create({
      data: {
        userId,
        actionType,
        description,
        points: POINTS_MAP[actionType] ?? 0,
      },
    });
  } catch (err) {
    console.error('[Audit] Failed to log action:', err);
  }
}
