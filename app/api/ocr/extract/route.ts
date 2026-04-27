import { NextRequest, NextResponse } from 'next/server';
import { extractDocument, type DocumentKind } from '@/lib/ocr';
import { getAdminSession } from '@/lib/adminAuth';
import { rateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB — Vision API also caps around this
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

function isKind(value: string): value is DocumentKind {
  return value === 'cmr' || value === 'inn' || value === 'passport';
}

/**
 * POST /api/ocr/extract
 *
 * Multipart form-data:
 *   - file: image (jpg/png/webp, ≤ 8 MB)
 *   - kind: 'cmr' | 'inn' | 'passport'
 *
 * Returns the parsed fields. Rate-limited to 10 requests / 5 minutes per IP
 * because OpenAI Vision is the most expensive operation in the system.
 */
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const ip = getClientIp(req);
  const rl = await rateLimit(ip, { key: 'ocr:extract', limit: 10, windowMs: 5 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 });
  }

  const file = form.get('file');
  const kindRaw = String(form.get('kind') || '').trim();

  if (!isKind(kindRaw)) {
    return NextResponse.json({ error: 'invalid_kind' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file_missing' }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: 'unsupported_type', got: file.type }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'file_too_large', max: MAX_BYTES }, { status: 413 });
  }

  // Convert to data URL — OpenAI Vision accepts data: URLs directly so we
  // don't have to upload to disk first.
  const buf = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buf.toString('base64')}`;

  const t0 = Date.now();
  const result = await extractDocument(kindRaw, dataUrl);
  log.info('ocr.extracted', {
    userId: session.userId,
    kind: kindRaw,
    ok: result.ok,
    confidence: result.confidence,
    durationMs: Date.now() - t0,
  });

  return NextResponse.json(result, { headers: rateLimitHeaders(rl) });
}
