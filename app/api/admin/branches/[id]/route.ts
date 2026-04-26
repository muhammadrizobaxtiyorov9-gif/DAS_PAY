import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/adminAuth';
import { canManageBranches } from '@/lib/branch';

export const runtime = 'nodejs';

const UpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  city: z.string().min(2).max(80).optional(),
  address: z.string().max(240).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  managerId: z.number().int().positive().nullable().optional(),
  active: z.boolean().optional(),
});

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  if (!canManageBranches(session)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await ctx.params;
  const branchId = Number(id);
  if (!Number.isFinite(branchId)) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const branch = await prisma.branch.update({
    where: { id: branchId },
    data: parsed.data,
  });
  return NextResponse.json({ branch });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  if (!canManageBranches(session)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await ctx.params;
  const branchId = Number(id);
  if (!Number.isFinite(branchId)) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  // Soft-delete: deactivate. Hard-delete would orphan data via SET NULL.
  await prisma.branch.update({ where: { id: branchId }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
