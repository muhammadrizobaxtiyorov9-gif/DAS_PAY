import type { Bot } from 'grammy';
import { prisma } from '../../lib/prisma';
import type { MyContext } from './message';

const STATUS_LABELS: Record<string, string> = {
  pending: '🕒 Kutilmoqda',
  confirmed: '✅ Tasdiqlangan',
  arrived_at_loading: '📍 Yuklash manzilida',
  documents_ready: '📄 Hujjatlar tayyor',
  loaded: '📦 Yuklangan',
  in_transit: "🚚 Yo'lda",
  delivered: '🏁 Yetkazildi',
};

/**
 * Resolve a Telegram user → DasPay employee account by username binding.
 * The User.username matches the Telegram @username (case-insensitive).
 */
async function resolveStaff(ctx: MyContext) {
  const tgUsername = ctx.from?.username;
  if (!tgUsername) return null;
  const user = await prisma.user.findFirst({
    where: { username: { equals: tgUsername, mode: 'insensitive' } },
    select: { id: true, username: true, name: true, role: true },
  });
  return user;
}

export function setupStaffCommands(bot: Bot<MyContext>) {
  // /status — DRIVER: show currently assigned shipment + status flow
  bot.command('status', async (ctx) => {
    const user = await resolveStaff(ctx);
    if (!user || user.role !== 'DRIVER') {
      return ctx.reply("⚠️ Bu buyruq faqat ro'yxatdan o'tgan haydovchilar uchun. Telegram username (@) sizning DasPay loginingizga mos kelishi kerak.");
    }

    const truck = await prisma.truck.findFirst({
      where: { driverId: user.id },
      include: {
        shipments: {
          where: { status: { notIn: ['delivered', 'unloaded'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!truck) {
      return ctx.reply("🚚 Sizga hech qanday avtomobil biriktirilmagan.");
    }
    const sh = truck.shipments[0];
    if (!sh) {
      return ctx.reply(`🚚 <b>${truck.plateNumber}</b> — bo'sh\nFaol yuk yo'q.`, { parse_mode: 'HTML' });
    }
    const label = STATUS_LABELS[sh.status] ?? sh.status;
    return ctx.reply(
      `🚚 <b>${truck.plateNumber}</b>\n\n` +
      `📦 Yuk: <code>${sh.trackingCode}</code>\n` +
      `📍 ${sh.origin} → ${sh.destination}\n` +
      `📊 Holat: <b>${label}</b>\n` +
      (sh.weight ? `⚖️ Vazn: ${sh.weight} kg\n` : ''),
      { parse_mode: 'HTML' },
    );
  });

  // /stats — Admin/Director: today's snapshot
  bot.command('stats', async (ctx) => {
    const user = await resolveStaff(ctx);
    if (!user || !['SUPERADMIN', 'ADMIN', 'DIRECTOR', 'ACCOUNTANT'].includes(user.role)) {
      return ctx.reply("⚠️ Bu buyruq faqat admin/direktor/buxgalter uchun.");
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      newLeadsToday,
      shipmentsToday,
      deliveredToday,
      paidToday,
      activeShipments,
      openAnomalies,
    ] = await Promise.all([
      prisma.lead.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.shipment.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.shipment.count({ where: { status: 'delivered', updatedAt: { gte: startOfDay } } }),
      prisma.invoice.aggregate({
        _sum: { paidAmount: true },
        where: { paidAt: { gte: startOfDay } },
      }),
      prisma.shipment.count({ where: { status: { in: ['in_transit', 'loaded', 'confirmed'] } } }),
      prisma.anomalyAlert.count({ where: { status: 'open' } }),
    ]);

    const paidTotal = paidToday._sum.paidAmount ?? 0;

    return ctx.reply(
      `📊 <b>Kunlik statistika</b>\n` +
      `📅 ${new Date().toLocaleDateString('uz-UZ')}\n\n` +
      `🆕 Yangi arizalar: <b>${newLeadsToday}</b>\n` +
      `📦 Yangi yuklar: <b>${shipmentsToday}</b>\n` +
      `🏁 Yetkazilgan: <b>${deliveredToday}</b>\n` +
      `💰 To'lov: <b>${paidTotal.toLocaleString('uz-UZ')}</b>\n\n` +
      `🚚 Hozir yo'lda: <b>${activeShipments}</b>\n` +
      `⚠️ Ochiq anomaliyalar: <b>${openAnomalies}</b>`,
      { parse_mode: 'HTML' },
    );
  });

  // /invoice — list unpaid invoices for the bound client phone
  bot.command('invoice', async (ctx) => {
    const tgId = ctx.from?.id?.toString();
    if (!tgId) return;
    const client = await prisma.client.findUnique({ where: { telegramId: tgId } });
    if (!client) {
      return ctx.reply("📲 Avval shaxsiy kabinetda Telegramni ulang: /start → 'Mening yuklarim'");
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        clientPhone: client.phone,
        status: { in: ['sent', 'overdue', 'draft'] },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });

    if (invoices.length === 0) {
      return ctx.reply("✅ To'lanmagan hisob-fakturalar yo'q.");
    }

    const lines = invoices.map((inv) => {
      const remain = inv.total - inv.paidAmount;
      const due = inv.dueDate.toLocaleDateString('uz-UZ');
      const overdue = inv.dueDate < new Date() ? ' ⚠️' : '';
      return `• <code>${inv.number}</code> — ${remain.toLocaleString('uz-UZ')} ${inv.currency} (${due})${overdue}`;
    });

    return ctx.reply(
      `💼 <b>To'lanmagan hisoblar</b>\n\n${lines.join('\n')}\n\nTo'lov uchun: /pay`,
      { parse_mode: 'HTML' },
    );
  });
}
