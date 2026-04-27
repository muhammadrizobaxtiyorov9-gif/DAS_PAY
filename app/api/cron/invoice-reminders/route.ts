import { NextRequest, NextResponse } from 'next/server';
import { runInvoiceReminders } from '@/lib/invoice-reminders';
import { cronSecret } from '@/lib/secrets';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/invoice-reminders?secret=...
 *
 * Schedule once per day. Walks every unpaid invoice and dispatches the
 * appropriate reminder (upcoming → due → overdue → escalated). Idempotent
 * — running twice in one day will not double-send.
 *
 * Recommended cron: `0 9 * * *` (every day at 09:00 Tashkent time).
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== cronSecret()) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await runInvoiceReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    log.error('cron.invoice_reminders_failed', { err });
    return NextResponse.json({ error: 'cron_failed' }, { status: 500 });
  }
}
