import 'server-only';
import { randomBytes } from 'crypto';
import { prisma } from './prisma';
import { sendTelegramToChat } from './telegram';
import { CONTACTS } from './contacts';

function randomToken(): string {
  return randomBytes(18).toString('base64url');
}

/**
 * Ensure a Feedback row exists for a delivered shipment. Idempotent.
 * Returns the feedback token (used to build the public survey URL).
 */
export async function ensureFeedbackForShipment(shipmentId: number): Promise<string> {
  const existing = await prisma.feedback.findUnique({ where: { shipmentId } });
  if (existing) return existing.token;

  const token = randomToken();
  await prisma.feedback.create({
    data: {
      shipmentId,
      score: 0,
      token,
    },
  });
  return token;
}

export async function requestFeedbackFromClient(args: {
  shipmentId: number;
  trackingCode: string;
  clientPhone: string | null | undefined;
}): Promise<{ sent: boolean; reason?: string }> {
  const { shipmentId, trackingCode, clientPhone } = args;
  if (!clientPhone) return { sent: false, reason: 'no_client_phone' };

  const client = await prisma.client.findUnique({ where: { phone: clientPhone } });
  if (!client?.telegramId) return { sent: false, reason: 'client_has_no_telegram' };
  if ((client as { notifyStatusChange?: boolean }).notifyStatusChange === false) {
    return { sent: false, reason: 'opted_out' };
  }

  const token = await ensureFeedbackForShipment(shipmentId);
  const url = `${CONTACTS.web.url}/uz/feedback/${token}`;

  const message =
    `🌟 <b>Yukingiz yetkazib berildi!</b>\n\n` +
    `<code>${trackingCode}</code>\n\n` +
    `Xizmat sifatini 0 dan 10 gacha baholang — bu bizga yaxshiroq bo'lishimizga yordam beradi.`;

  const replyMarkup = {
    inline_keyboard: [[{ text: '⭐ Baholash (30 soniya)', url }]],
  };

  const ok = await sendTelegramToChat(client.telegramId, message, { replyMarkup });
  return { sent: ok, reason: ok ? undefined : 'send_failed' };
}
