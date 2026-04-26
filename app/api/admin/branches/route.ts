import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/adminAuth';
import { canManageBranches } from '@/lib/branch';

export const runtime = 'nodejs';

const CreateSchema = z.object({
  code: z.string().min(2).max(16).regex(/^[A-Z0-9_-]+$/i),
  name: z.string().min(2).max(120),
  city: z.string().min(2).max(80),
  address: z.string().max(240).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  managerId: z.number().int().positive().optional().nullable(),
  active: z.boolean().optional(),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  // Anyone authenticated can list branches (needed for dropdowns); only SUPERADMIN can mutate.
  const branches = await prisma.branch.findMany({
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
    include: {
      _count: { select: { users: true, trucks: true, wagons: true, shipments: true } },
    },
  });
  return NextResponse.json({ branches });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  if (!canManageBranches(session)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const exists = await prisma.branch.findUnique({ where: { code: data.code.toUpperCase() } });
  if (exists) return NextResponse.json({ error: 'code_taken' }, { status: 409 });

  const branch = await prisma.branch.create({
    data: {
      code: data.code.toUpperCase(),
      name: data.name,
      city: data.city,
      address: data.address ?? null,
      phone: data.phone ?? null,
      managerId: data.managerId ?? null,
      active: data.active ?? true,
    },
  });
  return NextResponse.json({ branch });
}
