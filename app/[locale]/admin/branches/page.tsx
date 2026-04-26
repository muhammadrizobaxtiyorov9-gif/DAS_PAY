import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/adminAuth';
import { redirect } from 'next/navigation';
import { canManageBranches } from '@/lib/branch';
import { BranchesClient } from './BranchesClient';

export const dynamic = 'force-dynamic';

export default async function BranchesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin-login`);

  const [branches, users] = await Promise.all([
    prisma.branch.findMany({
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
      include: {
        _count: { select: { users: true, trucks: true, wagons: true, shipments: true } },
      },
    }),
    prisma.user.findMany({
      where: { status: 'ACTIVE', role: { in: ['ADMIN', 'DIRECTOR', 'SUPERADMIN'] } },
      select: { id: true, name: true, username: true, role: true },
      orderBy: { username: 'asc' },
    }),
  ]);

  return (
    <BranchesClient
      initialBranches={branches.map((b) => ({
        id: b.id,
        code: b.code,
        name: b.name,
        city: b.city,
        address: b.address,
        phone: b.phone,
        managerId: b.managerId,
        active: b.active,
        createdAt: b.createdAt.toISOString(),
        counts: b._count,
      }))}
      managers={users.map((u) => ({
        id: u.id,
        label: `${u.name || u.username} (${u.role})`,
      }))}
      canManage={canManageBranches(session)}
    />
  );
}
