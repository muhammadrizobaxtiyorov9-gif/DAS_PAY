import { NextRequest, NextResponse } from 'next/server';
import { contactFormSchema } from '@/lib/validations';
import { sendContactNotification } from '@/lib/telegram';
import { sendContactEmail } from '@/lib/email';

/**
 * Rate limiting configuration
 */
const RATE_LIMIT = 3; // max submissions per window
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

/**
 * Check rate limit for an IP
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (now - record.windowStart > RATE_LIMIT_WINDOW) {
    // Window expired, reset
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * POST /api/contact
 * Handle contact form submissions
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const result = contactFormSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, phone, email, service, message, honeypot } = result.data;

    // Check honeypot (spam protection)
    if (honeypot) {
      // Silently reject spam
      return NextResponse.json({ success: true });
    }

    // Send Telegram notification
    const telegramResult = await sendContactNotification({
      name,
      phone,
      email: email || undefined,
      service: service || undefined,
      message,
    });

    if (!telegramResult) {
      console.warn('[Contact API] Telegram notification failed');
    }

    // Send email notification
    const emailResult = await sendContactEmail({
      name,
      phone,
      email: email || undefined,
      service: service || undefined,
      message,
    });

    if (!emailResult) {
      console.warn('[Contact API] Email notification failed');
    }

    // In production, also save to database using Prisma:
    // await prisma.lead.create({
    //   data: { name, phone, email, service, message, ip },
    // });

    return NextResponse.json({ 
      success: true,
      message: 'Form submitted successfully',
    });
  } catch (error) {
    console.error('[Contact API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
