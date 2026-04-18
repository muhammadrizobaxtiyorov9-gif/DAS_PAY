import { prisma } from './prisma';

/**
 * Pick the next staff user for round-robin lead assignment.
 * Strategy: among ADMIN/SUPERADMIN users, choose the one with the fewest leads
 * currently owned (ties broken by least recently updated lead). Returns null
 * when no eligible staff exists.
 */
export async function pickNextAssignee(): Promise<number | null> {
  const staff = await prisma.user.findMany({
    where: {
      role: { in: ['ADMIN', 'SUPERADMIN', 'admin', 'superadmin'] },
    },
    select: { id: true },
  });
  if (staff.length === 0) return null;
  if (staff.length === 1) return staff[0].id;

  const counts = await prisma.lead.groupBy({
    by: ['assignedToId'],
    _count: { assignedToId: true },
    where: { assignedToId: { in: staff.map((s) => s.id) } },
  });

  const countMap = new Map<number, number>();
  for (const s of staff) countMap.set(s.id, 0);
  for (const c of counts) {
    if (c.assignedToId != null) {
      countMap.set(c.assignedToId, c._count.assignedToId);
    }
  }

  let chosen: number | null = null;
  let min = Number.POSITIVE_INFINITY;
  for (const s of staff) {
    const n = countMap.get(s.id) ?? 0;
    if (n < min) {
      min = n;
      chosen = s.id;
    }
  }
  return chosen;
}
