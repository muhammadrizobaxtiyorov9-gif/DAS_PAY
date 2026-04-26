import { NextRequest, NextResponse } from 'next/server';
import { contactFormSchema } from '@/lib/validations';
import { sendContactNotification } from '@/lib/telegram';
import { sendContactEmail } from '@/lib/email';
import prisma from '@/lib/prisma';
import { pickNextAssignee } from '@/lib/lead-assign';
import { rateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit';
import { createNotification } from '@/lib/notifications';
import { publish } from '@/lib/events';

/**
 * POST /api/contact
 * Handle contact form submissions
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(ip, { key: 'contact', limit: 3, windowMs: 60 * 60 * 1000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: rateLimitHeaders(rl) }
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

    const { name, phone, email, service, message, honeypot, fromStation, toStation, transportType } = result.data;

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

    // Save to database using Prisma (auto-assign to staff in round-robin)
    const assignedToId = await pickNextAssignee();
    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email,
        service,
        message,
        ip,
        status: 'new',
        fromStation,
        toStation,
        transportType,
        assignedToId: assignedToId ?? undefined,
      },
    });

    // Notification + Web Push: assigned admin or broadcast
    createNotification({
      userId: assignedToId ?? null,
      type: 'lead',
      title: 'Yangi mijoz arizasi',
      message: `${name} — ${phone}${service ? ` · ${service}` : ''}`,
      link: `/uz/admin/leads`,
      pushTag: `lead-${lead.id}`,
    }).catch((e) => console.error('[notify] lead', e));

    // Real-time stream
    publish('lead.created', {
      id: lead.id,
      name,
      phone,
      service: service ?? null,
      assignedToId: assignedToId ?? null,
    });

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
