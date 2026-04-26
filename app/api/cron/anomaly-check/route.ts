import { NextRequest, NextResponse } from 'next/server';
import { runAnomalyCheck } from '@/lib/anomaly';
import { cronSecret } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/anomaly-check?secret=...
 * Run every 5–15 minutes via cron.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== cronSecret()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runAnomalyCheck();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[anomaly] cron failed', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
