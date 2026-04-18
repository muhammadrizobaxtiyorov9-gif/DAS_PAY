import 'server-only';
import { prisma } from './prisma';
import { sendTelegramToChat } from './telegram';
import { CONTACTS } from './contacts';

interface EventPayload {
  statusUz: string;
  statusRu: string;
  statusEn: string;
  location?: string;
  date?: string;
  note?: string;
}

const STATUS_EMOJI: Record<string, string> = {
  delivered: '✅',
  in_transit: '🚚',
  inTransit: '🚚',
  customs: '🛃',
  processing: '📦',
  pending: '🕒',
  new: '🕒',
};

function emojiFor(status: string): string {
  return STATUS_EMOJI[status] ?? '📦';
}

function buildMessage(
  lang: 'uz' | 'ru' | 'en',
  trackingCode: string,
  currentStatus: string,
  event: EventPayload,
): string {
  const icon = emojiFor(currentStatus);
  const status = lang === 'uz' ? event.statusUz : lang === 'ru' ? event.statusRu : event.statusEn;

  if (lang === 'ru') {
    return (
      `${icon} <b>Обновление груза ${trackingCode}</b>\n\n` +
      `📊 <b>Статус:</b> ${status}\n` +
      (event.location ? `📍 <b>Место:</b> ${event.location}\n` : '') +
      (event.date ? `🕒 <b>Время:</b> ${event.date}\n` : '') +
      (event.note ? `\n💬 ${event.note}` : '')
    );
  }
  if (lang === 'en') {
    return (
      `${icon} <b>Shipment ${trackingCode} update</b>\n\n` +
      `📊 <b>Status:</b> ${status}\n` +
      (event.location ? `📍 <b>Location:</b> ${event.location}\n` : '') +
      (event.date ? `🕒 <b>Time:</b> ${event.date}\n` : '') +
      (event.note ? `\n💬 ${event.note}` : '')
    );
  }
  return (
    `${icon} <b>${trackingCode} yangilandi</b>\n\n` +
    `📊 <b>Holat:</b> ${status}\n` +
    (event.location ? `📍 <b>Joy:</b> ${event.location}\n` : '') +
    (event.date ? `🕒 <b>Vaqt:</b> ${event.date}\n` : '') +
    (event.note ? `\n💬 ${event.note}` : '')
  );
}

export async function notifyClientOfShipmentEvent(args: {
  trackingCode: string;
  currentStatus: string;
  clientPhone: string | null | undefined;
  event: EventPayload;
}): Promise<{ notified: boolean; reason?: string }> {
  const { trackingCode, currentStatus, clientPhone, event } = args;
  if (!clientPhone) return { notified: false, reason: 'no_client_phone' };

  const client = await prisma.client.findUnique({ where: { phone: clientPhone } });
  if (!client?.telegramId) return { notified: false, reason: 'client_has_no_telegram' };
  if ((client as { notifyStatusChange?: boolean }).notifyStatusChange === false) {
    return { notified: false, reason: 'opted_out' };
  }

  const msg = buildMessage('uz', trackingCode, currentStatus, event);
  const webLink = `${CONTACTS.web.url}/uz/tracking/${trackingCode}`;
  const replyMarkup = {
    inline_keyboard: [[{ text: '🌐 Batafsil', url: webLink }]],
  };

  const ok = await sendTelegramToChat(client.telegramId, msg, { replyMarkup });
  return { notified: ok, reason: ok ? undefined : 'send_failed' };
}
