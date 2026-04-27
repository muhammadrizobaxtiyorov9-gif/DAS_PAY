import 'server-only';
import { prisma } from './prisma';
import { sendEmail } from './email';
import { sendTelegramToChat } from './telegram';
import { createNotification } from './notifications';
import { formatMoney } from './money';
import { CONTACTS } from './contacts';
import { log } from './logger';

/**
 * Invoice reminder cadence:
 *
 *   stage 0 = nothing sent yet
 *   stage 1 = "upcoming" — fired 3 days before dueDate
 *   stage 2 = "due today" — fired on dueDate
 *   stage 3 = "overdue" — fired 3 days after dueDate
 *   stage 4 = "escalated" — fired 7 days after dueDate, also alerts
 *             SUPERADMIN/DIRECTOR users in-app + push
 *
 * Stage advances monotonically — we never re-send a previous stage. The
 * cron should run once per day; running more often is harmless because
 * `lastReminderStage` guards against duplicate sends.
 */

export const STAGE_NONE = 0;
export const STAGE_UPCOMING = 1;
export const STAGE_DUE = 2;
export const STAGE_OVERDUE = 3;
export const STAGE_ESCALATED = 4;

export type ReminderStage =
  | typeof STAGE_NONE
  | typeof STAGE_UPCOMING
  | typeof STAGE_DUE
  | typeof STAGE_OVERDUE
  | typeof STAGE_ESCALATED;

interface InvoiceForReminder {
  id: number;
  number: string;
  dueDate: Date;
  total: number;
  paidAmount: number;
  currency: string;
  status: string;
  lastReminderStage: number;
  client: { phone: string; name: string | null; telegramId: string | null; notifyEmail: string | null; notifyInvoices: boolean } | null;
}

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 86_400_000);
}

/** Decide what stage an invoice is due for *today*. Returns 0 if nothing. */
export function nextStageFor(invoice: { dueDate: Date; lastReminderStage: number }, today: Date): ReminderStage {
  const diff = daysBetween(today, invoice.dueDate); // positive => future, negative => past
  let target: ReminderStage = STAGE_NONE;
  if (diff <= -7) target = STAGE_ESCALATED;
  else if (diff <= -3) target = STAGE_OVERDUE;
  else if (diff <= 0) target = STAGE_DUE;
  else if (diff <= 3) target = STAGE_UPCOMING;

  // Never go backwards.
  if (target <= invoice.lastReminderStage) return STAGE_NONE;
  return target;
}

interface SubjectAndBody {
  subjectUz: string;
  bodyUz: string;
  bodyTelegramHtml: string;
}

function buildReminderContent(invoice: InvoiceForReminder, stage: ReminderStage): SubjectAndBody {
  const balance = invoice.total - invoice.paidAmount;
  const balanceStr = formatMoney(balance, invoice.currency);
  const dueStr = invoice.dueDate.toISOString().slice(0, 10);
  const link = `${CONTACTS.web.url}/uz/cabinet/invoices`;

  if (stage === STAGE_UPCOMING) {
    return {
      subjectUz: `Eslatma: ${invoice.number} hisob 3 kun ichida to'lash kerak`,
      bodyUz:
        `Hurmatli mijoz,\n\n` +
        `Sizning ${invoice.number} hisobingizning to'lov muddati ${dueStr} kuni tugaydi.\n` +
        `To'lanmagan summa: ${balanceStr}\n\n` +
        `Hisobni ko'rish: ${link}`,
      bodyTelegramHtml:
        `🕒 <b>Eslatma</b>\n\n` +
        `Hisob <b>${invoice.number}</b>\n` +
        `To'lov muddati: <b>${dueStr}</b>\n` +
        `Summa: <b>${balanceStr}</b>\n\n` +
        `<a href="${link}">Hisobni ko'rish</a>`,
    };
  }
  if (stage === STAGE_DUE) {
    return {
      subjectUz: `Bugun to'lov kerak: ${invoice.number}`,
      bodyUz:
        `Hurmatli mijoz,\n\n` +
        `Sizning ${invoice.number} hisobingiz bugun to'lanishi kerak.\n` +
        `To'lanmagan summa: ${balanceStr}\n\n` +
        `Hisob: ${link}`,
      bodyTelegramHtml:
        `📅 <b>Bugun to'lov kuni</b>\n\n` +
        `Hisob <b>${invoice.number}</b>\n` +
        `Summa: <b>${balanceStr}</b>\n\n` +
        `<a href="${link}">Hisobni ko'rish</a>`,
    };
  }
  if (stage === STAGE_OVERDUE) {
    return {
      subjectUz: `Muddati o'tdi: ${invoice.number}`,
      bodyUz:
        `Hurmatli mijoz,\n\n` +
        `${invoice.number} hisobingizning to'lov muddati ${dueStr} edi va o'tib ketdi.\n` +
        `To'lanmagan summa: ${balanceStr}\n\n` +
        `Iltimos, imkon qadar tezroq to'lashingizni so'raymiz.\n` +
        `Hisob: ${link}\n\n` +
        `Savollar bo'lsa: ${CONTACTS.phone.display}`,
      bodyTelegramHtml:
        `⚠️ <b>To'lov muddati o'tdi</b>\n\n` +
        `Hisob <b>${invoice.number}</b>\n` +
        `Muddati: ${dueStr}\n` +
        `Qarz: <b>${balanceStr}</b>\n\n` +
        `Iltimos to'lov qiling: <a href="${link}">${link}</a>`,
    };
  }
  // STAGE_ESCALATED
  return {
    subjectUz: `Yakuniy ogohlantirish: ${invoice.number}`,
    bodyUz:
      `Hurmatli mijoz,\n\n` +
      `${invoice.number} hisobingiz 7 kundan beri to'lanmagan.\n` +
      `Qarz: ${balanceStr}\n\n` +
      `Bu xabar oxirgi do'stona eslatma hisoblanadi. Bog'lanish uchun: ${CONTACTS.phone.display}`,
    bodyTelegramHtml:
      `🔴 <b>Yakuniy ogohlantirish</b>\n\n` +
      `Hisob <b>${invoice.number}</b>\n` +
      `Qarz: <b>${balanceStr}</b>\n` +
      `7+ kundan beri to'lanmagan.\n\n` +
      `Iltimos bog'laning: ${CONTACTS.phone.display}`,
  };
}

async function escalateToManagement(invoice: InvoiceForReminder): Promise<void> {
  // In-app notification + push for SUPERADMIN/DIRECTOR roles.
  // We broadcast (userId=null) — the admins decide who follows up.
  await createNotification({
    userId: null,
    type: 'invoice',
    title: `Hisob ${invoice.number} 7+ kun muddati o'tdi`,
    message: `${invoice.client?.name || 'Mijoz'} · qarz ${formatMoney(invoice.total - invoice.paidAmount, invoice.currency)}`,
    link: `/uz/admin/invoices`,
    pushTag: `invoice-escalation-${invoice.id}`,
  }).catch((err) => log.error('reminder.escalation_push_failed', { err }));
}

async function dispatchReminder(invoice: InvoiceForReminder, stage: ReminderStage): Promise<{ sent: boolean; channels: string[] }> {
  const channels: string[] = [];
  const content = buildReminderContent(invoice, stage);

  // Skip entirely if the client opted out of invoice notifications.
  if (invoice.client && invoice.client.notifyInvoices === false) {
    return { sent: false, channels: [] };
  }

  // Email — preferred channel because it has the link + ledger
  const email = invoice.client?.notifyEmail;
  if (email) {
    const ok = await sendEmail({
      to: email,
      subject: content.subjectUz,
      html: `<pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${content.bodyUz}</pre>`,
      text: content.bodyUz,
    });
    if (ok) channels.push('email');
  }

  // Telegram — if the client linked their account
  const telegramId = invoice.client?.telegramId;
  if (telegramId) {
    const ok = await sendTelegramToChat(telegramId, content.bodyTelegramHtml, {
      replyMarkup: { inline_keyboard: [[{ text: '💳 Hisobni to\'lash', url: `${CONTACTS.web.url}/uz/cabinet/invoices` }]] },
    });
    if (ok) channels.push('telegram');
  }

  if (stage === STAGE_ESCALATED) {
    await escalateToManagement(invoice);
    channels.push('admin-broadcast');
  }

  return { sent: channels.length > 0, channels };
}

export interface ReminderRunResult {
  scanned: number;
  sent: number;
  byStage: Record<string, number>;
  errors: number;
}

/**
 * Walk every unpaid invoice and dispatch the appropriate reminder.
 * Idempotent within the same day — `lastReminderStage` blocks repeats.
 */
export async function runInvoiceReminders(now: Date = new Date()): Promise<ReminderRunResult> {
  // Reset hours so day-diff calculations are stable.
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);

  // Only consider invoices that are actually owed money.
  const candidates = await prisma.invoice.findMany({
    where: {
      status: { in: ['sent', 'overdue', 'draft'] },
      // Skip fully paid (paidAmount >= total)
      NOT: { status: { in: ['paid', 'cancelled'] } },
    },
    include: {
      client: {
        select: { phone: true, name: true, telegramId: true, notifyEmail: true, notifyInvoices: true },
      },
    },
  });

  const result: ReminderRunResult = {
    scanned: candidates.length,
    sent: 0,
    byStage: { '1': 0, '2': 0, '3': 0, '4': 0 },
    errors: 0,
  };

  for (const invRaw of candidates) {
    // Until `prisma generate` regenerates the client (dev server holds a
    // file lock on Windows), the TS shape doesn't yet include the two new
    // reminder columns. They exist in the schema and the DB after `db push`
    // — runtime is fine; this cast just satisfies TS in the meantime.
    const inv = invRaw as typeof invRaw & { lastReminderStage: number; lastReminderAt: Date | null };

    const balance = inv.total - inv.paidAmount;
    if (balance <= 0) continue;

    const stage = nextStageFor(inv, today);
    if (stage === STAGE_NONE) continue;

    try {
      const { sent } = await dispatchReminder(inv as InvoiceForReminder, stage);
      // Always advance the stage even if no channel succeeded — otherwise we
      // retry in a tight loop and spam the few channels that *did* work.
      await prisma.invoice.update({
        where: { id: inv.id },
        data: {
          lastReminderStage: stage,
          lastReminderAt: now,
          // Auto-flip status to 'overdue' the first time we cross past dueDate
          ...(stage >= STAGE_OVERDUE && inv.status !== 'overdue'
            ? { status: 'overdue' }
            : {}),
        } as Parameters<typeof prisma.invoice.update>[0]['data'],
      });
      if (sent) {
        result.sent += 1;
        result.byStage[String(stage)] = (result.byStage[String(stage)] ?? 0) + 1;
      }
    } catch (err) {
      result.errors += 1;
      log.error('reminder.dispatch_failed', { invoiceId: inv.id, stage, err });
    }
  }

  log.info('reminder.run_complete', result);
  return result;
}
