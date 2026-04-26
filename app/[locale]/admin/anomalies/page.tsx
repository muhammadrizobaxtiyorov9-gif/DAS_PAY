import { prisma } from '@/lib/prisma';
import { AnomaliesClient } from './AnomaliesClient';

export const dynamic = 'force-dynamic';

export default async function AnomaliesPage() {
  const alerts = await prisma.anomalyAlert.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 200,
  });

  const items = alerts.map((a) => ({
    id: a.id,
    kind: a.kind,
    entityType: a.entityType,
    entityId: a.entityId,
    title: a.title,
    message: a.message,
    severity: a.severity,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
    resolvedAt: a.resolvedAt?.toISOString() ?? null,
  }));

  return <AnomaliesClient initialAlerts={items} />;
}
