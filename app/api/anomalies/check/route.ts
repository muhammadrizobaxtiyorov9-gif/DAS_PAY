import { NextResponse } from 'next/server';
import { runAnomalyCheck } from '@/lib/anomaly';
import { getAdminSession } from '@/lib/adminAuth';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/anomalies/check
 *
 * Admin-triggered manual anomaly scan. Uses the admin session cookie so the
 * UI never has to handle CRON_SECRET. The scheduled job at
 * /api/cron/anomaly-check still runs on its own with the cron secret.
 */
export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const allowed = ['SUPERADMIN', 'ADMIN', 'DIRECTOR'];
  if (!allowed.includes(session.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    const result = await runAnomalyCheck();
    log.info('anomaly.manual_check', { userId: session.userId, ...result });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    log.error('anomaly.manual_check_failed', { err });
    return NextResponse.json({ error: 'check_failed' }, { status: 500 });
  }
}
