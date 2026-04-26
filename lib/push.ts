import 'server-only';
import webpush from 'web-push';
import { prisma } from './prisma';

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@das-pay.com';
  if (!publicKey || !privateKey) {
    console.warn('[push] VAPID keys missing, push notifications disabled');
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

export async function sendPushToUser(userId: number, payload: PushPayload): Promise<number> {
  if (!ensureConfigured()) return 0;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  return sendToSubscriptions(subs, payload);
}

export async function sendPushToClient(clientId: number, payload: PushPayload): Promise<number> {
  if (!ensureConfigured()) return 0;
  const subs = await prisma.pushSubscription.findMany({ where: { clientId } });
  return sendToSubscriptions(subs, payload);
}

export async function broadcastPushToAdmins(payload: PushPayload): Promise<number> {
  if (!ensureConfigured()) return 0;
  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { not: null } },
  });
  return sendToSubscriptions(subs, payload);
}

type SubRow = {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  failures: number;
};

async function sendToSubscriptions(subs: SubRow[], payload: PushPayload): Promise<number> {
  if (subs.length === 0) return 0;
  const body = JSON.stringify(payload);
  let sent = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
        sent += 1;
        await prisma.pushSubscription.update({
          where: { id: s.id },
          data: { lastSuccess: new Date(), failures: 0 },
        });
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410 || s.failures >= 4) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => null);
          return;
        }
        await prisma.pushSubscription
          .update({ where: { id: s.id }, data: { failures: { increment: 1 } } })
          .catch(() => null);
        console.error('[push] send failed', status, (err as Error).message);
      }
    }),
  );

  return sent;
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}