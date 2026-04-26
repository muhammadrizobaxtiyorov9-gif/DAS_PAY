import 'server-only';
import { prisma } from './prisma';
import { broadcastPushToAdmins, sendPushToUser } from './push';
import { publish } from './events';

export type NotificationType =
  | 'lead'
  | 'shipment'
  | 'invoice'
  | 'sla'
  | 'driver'
  | 'system';

export interface CreateNotificationInput {
  /** Target user — undefined or null = broadcast to all admins */
  userId?: number | null;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  /** Whether to also fire a Web Push (default true) */
  push?: boolean;
  /** Push tag (deduplicates banners on the device) */
  pushTag?: string;
}

/**
 * Create an in-app Notification row + (optionally) fire Web Push.
 * Single entry point for all event hooks.
 */
export async function createNotification(input: CreateNotificationInput) {
  const { userId, type, title, message, link, push = true, pushTag } = input;

  const created = await prisma.notification.create({
    data: {
      userId: userId ?? null,
      type,
      title,
      message,
      link: link ?? null,
    },
  });

  // Live-stream the notification to connected dashboards
  publish('notification', {
    id: created.id,
    userId: userId ?? null,
    type,
    title,
    message,
    link: link ?? null,
  });

  if (push) {
    const payload = {
      title,
      body: message,
      url: link || '/',
      tag: pushTag || `${type}-${Date.now()}`,
    };
    if (userId) {
      sendPushToUser(userId, payload).catch((e) => console.error('[notify] push user', e));
    } else {
      broadcastPushToAdmins(payload).catch((e) => console.error('[notify] push broadcast', e));
    }
  }
}
