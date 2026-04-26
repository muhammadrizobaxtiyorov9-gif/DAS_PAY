import 'server-only';

interface SessionLike {
  role: string;
  branchId: number | null;
}

/**
 * Returns a Prisma `where` clause restricting rows to the user's branch.
 * SUPERADMIN/DIRECTOR see everything. Other roles without a branchId see nothing
 * (empty array trick) — admins must be assigned to a branch.
 */
export function branchWhere(session: SessionLike): { branchId?: number | { in: number[] } } {
  if (session.role === 'SUPERADMIN' || session.role === 'DIRECTOR') return {};
  if (session.branchId == null) return { branchId: { in: [-1] } };
  return { branchId: session.branchId };
}

/**
 * Returns the branchId to assign on row creation. SUPERADMIN/DIRECTOR can
 * pass an explicit override; others always get their own branch.
 */
export function branchOnCreate(
  session: SessionLike,
  override?: number | null,
): number | null {
  if (session.role === 'SUPERADMIN' || session.role === 'DIRECTOR') {
    return override ?? null;
  }
  return session.branchId ?? null;
}

/** Whether the session can manage Branch entities (create/edit/delete). */
export function canManageBranches(session: SessionLike): boolean {
  return session.role === 'SUPERADMIN';
}

/** Whether the session can switch between branches in the UI. */
export function canSwitchBranch(session: SessionLike): boolean {
  return session.role === 'SUPERADMIN' || session.role === 'DIRECTOR';
}
