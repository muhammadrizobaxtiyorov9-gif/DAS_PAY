import { Bot, Context, SessionFlavor } from 'grammy';
import { prisma } from '../../lib/prisma';
import { pickNextAssignee } from '../../lib/lead-assign';
import { computeQuote } from '../../lib/quote';
import { formatMoney } from '../../lib/money';
import { CONTACTS, getAddress, getWorkHours, type LocaleKey } from '../../lib/contacts';
import {
  botMessages,
  detectLocale,
  t,
  type BotLocale,
  type ShipmentLike,
} from '../i18n';
import {
  mainMenu,
  servicesMenu,
  cancelKeyboard,
  contactShareKeyboard,
  shipmentInlineMenu,
  languageMenu,
  contactInlineMenu,
  WEB_APP_URL,
} from '../menus';

type SessionStep =
  | 'idle'
  | 'awaiting_tracking'
  | 'awaiting_support_message'
  | 'calc_origin'
  | 'calc_dest'
  | 'calc_weight'
  | 'calc_phone';

interface SessionData {
  step: SessionStep;
  locale: BotLocale;
  calcData: {
    origin?: string;
    destination?: string;
    weight?: string;
    estimate?: number;
    estimateLabel?: string;
  };
}

export type MyContext = Context & SessionFlavor<SessionData>;

export function initial(): SessionData {
  return { step: 'idle', locale: 'uz', calcData: {} };
}

function getLocaleFromSession(ctx: MyContext): BotLocale {
  return ctx.session.locale || detectLocale(ctx.from?.language_code);
}

function clientNameFromCtx(ctx: MyContext): string {
  return ctx.from?.first_name || 'User';
}

async function findClient(tgId?: string) {
  if (!tgId) return null;
  return prisma.client.findFirst({ where: { telegramId: tgId } });
}

async function logTracking(code: string, found: boolean) {
  try {
    await prisma.trackingQuery.create({
      data: { trackingCode: code, ip: 'telegram', found },
    });
  } catch {
    /* ignore */
  }
}

export function setupMessageHandlers(bot: Bot<MyContext>) {
  // ------------------------ /start ------------------------
  bot.command('start', async (ctx) => {
    ctx.session.step = 'idle';
    const locale = getLocaleFromSession(ctx);
    const tr = t(locale);
    const firstName = clientNameFromCtx(ctx);
    const tgId = ctx.from?.id.toString();
    const client = await findClient(tgId);

    if (!client) {
      await ctx.reply(tr.start.welcome(firstName), { parse_mode: 'HTML' });
      await ctx.reply(tr.start.askPhone, {
        reply_markup: contactShareKeyboard(tr.start.askPhone),
      });
    } else {
      await ctx.reply(tr.start.welcomeBack(firstName), {
        parse_mode: 'HTML',
        reply_markup: mainMenu(locale, tgId),
      });
    }
  });

  // ------------------------ /help ------------------------
  bot.command('help', async (ctx) => {
    const locale = getLocaleFromSession(ctx);
    await ctx.reply(t(locale).help, { parse_mode: 'HTML' });
  });

  // ------------------------ /lang ------------------------
  bot.command('lang', async (ctx) => {
    const locale = getLocaleFromSession(ctx);
    await ctx.reply(t(locale).lang.prompt, { reply_markup: languageMenu() });
  });

  bot.callbackQuery(/^set_lang_(uz|ru|en)$/, async (ctx) => {
    const code = ctx.match[1] as BotLocale;
    ctx.session.locale = code;
    await ctx.answerCallbackQuery();
    await ctx.reply(t(code).lang.changed, {
      reply_markup: mainMenu(code, ctx.from?.id.toString()),
    });
  });

  // ------------------------ /contact ------------------------
  bot.command('contact', async (ctx) => sendContact(ctx));
  bot.command('track', async (ctx) => sendTrackPrompt(ctx));
  bot.command('services', async (ctx) => sendServices(ctx));
  bot.command('calc', async (ctx) => startCalculator(ctx));
  bot.command('shipments', async (ctx) => sendMyShipments(ctx));
  bot.command('support', async (ctx) => startSupport(ctx));
  bot.command('pay', async (ctx) => sendPayableInvoices(ctx));

  // ------------------------ Contact shared ------------------------
  bot.on('message:contact', async (ctx) => {
    const locale = getLocaleFromSession(ctx);
    const tr = t(locale);
    const session = ctx.session;
    const phone = ctx.message.contact.phone_number.replace('+', '');
    const tgId = ctx.from?.id.toString() || '';
    const firstName = clientNameFromCtx(ctx);

    if (session.step === 'calc_phone') {
      session.step = 'idle';
      try {
        const assignedToId = await pickNextAssignee();
        await prisma.lead.create({
          data: {
            name: firstName,
            phone,
            service: `Telegram Bot Calculator (${session.calcData.weight} tonna, ~${session.calcData.estimateLabel || `$${session.calcData.estimate}`})`,
            message: `Route: ${session.calcData.origin} -> ${session.calcData.destination}. Username: @${ctx.from?.username || ''}`,
            ip: 'telegram',
            status: 'new',
            assignedToId: assignedToId ?? undefined,
          },
        });
        await ctx.reply(tr.calc.submitted, {
          parse_mode: 'HTML',
          reply_markup: mainMenu(locale, tgId),
        });
      } catch {
        await ctx.reply(tr.start.error, { reply_markup: mainMenu(locale, tgId) });
      }
      return;
    }

    try {
      await prisma.client.upsert({
        where: { phone },
        update: { telegramId: tgId, name: firstName },
        create: { phone, telegramId: tgId, name: firstName },
      });
      await ctx.reply(tr.start.registered, {
        parse_mode: 'HTML',
        reply_markup: mainMenu(locale, tgId),
      });
    } catch (e) {
      console.error(e);
      await ctx.reply(tr.start.error);
    }
  });

  // ------------------------ Menu matching (multi-locale) ------------------------
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text.trim();
    const locale = getLocaleFromSession(ctx);
    const session = ctx.session;

    if (matchesMenu(text, 'cancel')) {
      session.step = 'idle';
      await ctx.reply(t(locale).calc.cancelled, {
        reply_markup: mainMenu(locale, ctx.from?.id.toString()),
      });
      return;
    }

    if (matchesMenu(text, 'language')) {
      await ctx.reply(t(locale).lang.prompt, { reply_markup: languageMenu() });
      return;
    }

    if (matchesMenu(text, 'track')) return sendTrackPrompt(ctx);
    if (matchesMenu(text, 'services')) return sendServices(ctx);
    if (matchesMenu(text, 'calculator')) return startCalculator(ctx);
    if (matchesMenu(text, 'myShipments')) return sendMyShipments(ctx);
    if (matchesMenu(text, 'support')) return startSupport(ctx);
    if (matchesMenu(text, 'contact')) return sendContact(ctx);
    if (matchesMenu(text, 'profile')) return sendProfile(ctx);

    // Tracking pattern — auto recognize
    if (/dp[-\s]?\d+/i.test(text)) {
      const code = text.toUpperCase().replace(/\s/g, '').replace(/^DP(\d)/, 'DP-$1');
      return doTrack(ctx, code);
    }

    // Conversation states
    if (session.step === 'awaiting_tracking') {
      session.step = 'idle';
      return doTrack(ctx, text.toUpperCase());
    }

    if (session.step === 'awaiting_support_message') {
      session.step = 'idle';
      try {
        const assignedToId = await pickNextAssignee();
        await prisma.lead.create({
          data: {
            name: ctx.from?.first_name || 'Telegram User',
            phone: 'telegram_support',
            service: 'Telegram Bot Support',
            message: `From @${ctx.from?.username || ''} (tgId: ${ctx.from?.id}):\n\n${text}`,
            ip: 'telegram',
            status: 'new',
            assignedToId: assignedToId ?? undefined,
          },
        });
        await ctx.reply(t(locale).support.submitted, {
          reply_markup: mainMenu(locale, ctx.from?.id.toString()),
        });
      } catch {
        await ctx.reply(t(locale).start.error);
      }
      return;
    }

    if (session.step === 'calc_origin') {
      session.calcData.origin = text;
      session.step = 'calc_dest';
      await ctx.reply(t(locale).calc.askDest, {
        parse_mode: 'HTML',
        reply_markup: cancelKeyboard(locale),
      });
      return;
    }

    if (session.step === 'calc_dest') {
      session.calcData.destination = text;
      session.step = 'calc_weight';
      await ctx.reply(t(locale).calc.askWeight, {
        parse_mode: 'HTML',
        reply_markup: cancelKeyboard(locale),
      });
      return;
    }

    if (session.step === 'calc_weight') {
      const w = parseFloat(text);
      if (isNaN(w) || w <= 0) {
        await ctx.reply(t(locale).calc.invalidWeight, {
          reply_markup: cancelKeyboard(locale),
        });
        return;
      }
      session.calcData.weight = text;
      session.step = 'calc_phone';
      let est = 0;
      let estLabel = '';
      let noTariff = false;
      try {
        const quote = await computeQuote({
          originCountry: session.calcData.origin || '',
          destCountry: session.calcData.destination || '',
          weightTon: w,
        });
        if (quote.noTariffFound) {
          noTariff = true;
        } else {
          est = Math.round(quote.price);
          estLabel = formatMoney(quote.price, quote.currency);
        }
      } catch {
        noTariff = true;
      }
      session.calcData.estimate = est;
      session.calcData.estimateLabel = estLabel;

      if (noTariff) {
        // No tariff — managers will calculate
        const noTariffMsg = locale === 'ru'
          ? `📋 <b>Заявка на расчёт</b>\n\n📍 Маршрут: ${session.calcData.origin} → ${session.calcData.destination}\n⚖️ Вес: ${text} т\n\nТариф для данного направления пока не установлен. <b>Наши менеджеры рассчитают стоимость и свяжутся с вами в течение 1 часа.</b>\n\nОтправьте номер телефона для подтверждения 👇`
          : locale === 'en'
          ? `📋 <b>Quote request</b>\n\n📍 Route: ${session.calcData.origin} → ${session.calcData.destination}\n⚖️ Weight: ${text} tons\n\nNo tariff found for this route. <b>Our managers will calculate the price and contact you within 1 hour.</b>\n\nShare your phone number to confirm 👇`
          : `📋 <b>Narx so'rovi</b>\n\n📍 Yo'nalish: ${session.calcData.origin} → ${session.calcData.destination}\n⚖️ Og'irlik: ${text} tonna\n\nUshbu yo'nalish uchun tarif hozircha mavjud emas. <b>Menejerlarimiz narxni hisoblab, 1 soat ichida siz bilan aloqaga chiqishadi.</b>\n\nTasdiqlash uchun telefon raqamingizni yuboring 👇`;
        await ctx.reply(noTariffMsg, {
          parse_mode: 'HTML',
          reply_markup: contactShareKeyboard('📱 ' + text),
        });
      } else {
        await ctx.reply(
          t(locale).calc.askPhone(
            session.calcData.origin || '',
            session.calcData.destination || '',
            text,
            session.calcData.estimateLabel || '',
          ),
          {
            parse_mode: 'HTML',
            reply_markup: contactShareKeyboard('📱 ' + text),
          },
        );
      }
      return;
    }

    if (session.step === 'calc_phone') {
      // Fallback: typed phone
      session.step = 'idle';
      const phone = text.replace(/[^\d+]/g, '').replace('+', '');
      const tgId = ctx.from?.id.toString() || '';
      try {
        const assignedToId = await pickNextAssignee();
        await prisma.lead.create({
          data: {
            name: ctx.from?.first_name || 'Telegram User',
            phone,
            service: `Telegram Bot Calculator (${session.calcData.weight} tonna, ~${session.calcData.estimateLabel || `$${session.calcData.estimate}`})`,
            message: `Route: ${session.calcData.origin} -> ${session.calcData.destination}. Username: @${ctx.from?.username || ''}`,
            ip: 'telegram',
            status: 'new',
            assignedToId: assignedToId ?? undefined,
          },
        });
        await ctx.reply(t(locale).calc.submitted, {
          parse_mode: 'HTML',
          reply_markup: mainMenu(locale, tgId),
        });
      } catch {
        await ctx.reply(t(locale).start.error, {
          reply_markup: mainMenu(locale, tgId),
        });
      }
      return;
    }

    // Fallback
    await ctx.reply(t(locale).fallback, {
      reply_markup: mainMenu(locale, ctx.from?.id.toString()),
    });
  });

  // ------------------------ Services callbacks ------------------------
  bot.callbackQuery(/^service_(international|expedition|warehouse|repair|rent)$/, async (ctx) => {
    const key = ctx.match[1] as keyof typeof botMessages.uz.services.items;
    const locale = getLocaleFromSession(ctx);
    await ctx.answerCallbackQuery();
    await ctx.reply(t(locale).services.items[key].body, { parse_mode: 'HTML' });
  });
}

// ------------------------ Action helpers ------------------------

async function sendTrackPrompt(ctx: MyContext) {
  const locale = getLocaleFromSession(ctx);
  ctx.session.step = 'awaiting_tracking';
  await ctx.reply(t(locale).track.prompt, {
    parse_mode: 'HTML',
    reply_markup: cancelKeyboard(locale),
  });
}

async function doTrack(ctx: MyContext, rawCode: string) {
  const locale = getLocaleFromSession(ctx);
  const tr = t(locale);
  const code = rawCode.replace(/\s+/g, '');
  await ctx.replyWithChatAction('typing');
  try {
    const shipment = await prisma.shipment.findUnique({ where: { trackingCode: code } });
    await logTracking(code, !!shipment);
    if (!shipment) {
      await ctx.reply(tr.track.notFound(code), {
        parse_mode: 'HTML',
        reply_markup: mainMenu(locale, ctx.from?.id.toString()),
      });
      return;
    }

    const like: ShipmentLike = {
      trackingCode: shipment.trackingCode,
      senderName: shipment.senderName,
      receiverName: shipment.receiverName,
      origin: shipment.origin,
      destination: shipment.destination,
      status: shipment.status,
      weight: shipment.weight,
      updatedAt: shipment.updatedAt,
      events: shipment.events,
    };

    await ctx.reply(tr.track.card(like), {
      parse_mode: 'HTML',
      reply_markup: shipmentInlineMenu(shipment.trackingCode, locale),
    });
  } catch {
    await ctx.reply(tr.start.error);
  }
}

async function sendServices(ctx: MyContext) {
  const locale = getLocaleFromSession(ctx);
  ctx.session.step = 'idle';
  await ctx.reply(t(locale).services.intro, {
    reply_markup: servicesMenu(locale),
  });
}

async function startCalculator(ctx: MyContext) {
  const locale = getLocaleFromSession(ctx);
  ctx.session.step = 'calc_origin';
  ctx.session.calcData = {};
  await ctx.reply(t(locale).calc.start, {
    parse_mode: 'HTML',
    reply_markup: cancelKeyboard(locale),
  });
}

async function sendMyShipments(ctx: MyContext) {
  const locale = getLocaleFromSession(ctx);
  const tr = t(locale);
  const tgId = ctx.from?.id.toString();
  const client = await findClient(tgId);

  if (!client) {
    await ctx.reply(tr.profile.notRegistered);
    return;
  }

  const shipments = await prisma.shipment.findMany({
    where: { clientPhone: client.phone },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });

  if (shipments.length === 0) {
    await ctx.reply(tr.shipments.empty, { parse_mode: 'HTML' });
    return;
  }

  await ctx.reply(tr.shipments.header(shipments.length), { parse_mode: 'HTML' });

  for (const s of shipments) {
    const like: ShipmentLike = {
      trackingCode: s.trackingCode,
      senderName: s.senderName,
      receiverName: s.receiverName,
      origin: s.origin,
      destination: s.destination,
      status: s.status,
      weight: s.weight,
      updatedAt: s.updatedAt,
      events: s.events,
    };
    await ctx.reply(tr.track.card(like), {
      parse_mode: 'HTML',
      reply_markup: shipmentInlineMenu(s.trackingCode, locale),
    });
  }
}

async function sendPayableInvoices(ctx: MyContext) {
  const tgId = ctx.from?.id.toString();
  const client = await findClient(tgId);
  if (!client) {
    await ctx.reply("Avval ro'yxatdan o'ting (telefon raqamingizni /start orqali yuboring).");
    return;
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      clientPhone: client.phone,
      status: { in: ['sent', 'overdue'] },
    },
    orderBy: { dueDate: 'asc' },
    take: 5,
  });

  if (invoices.length === 0) {
    await ctx.reply("✅ Sizda to'lanishi kerak bo'lgan invoyslar yo'q.");
    return;
  }

  await ctx.reply(`💳 <b>To'lanishi kerak invoyslar (${invoices.length})</b>`, { parse_mode: 'HTML' });

  for (const inv of invoices) {
    const balance = inv.total - inv.paidAmount;
    const payUrl = `${CONTACTS.web.url}/uz/cabinet/invoices/${inv.id}`;
    await ctx.reply(
      `<b>${inv.number}</b>\n` +
        `💰 ${formatMoney(balance, inv.currency)}\n` +
        `📅 Muddat: ${inv.dueDate.toLocaleDateString('uz-UZ')}`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: "💳 Onlayn to'lash", url: payUrl }]],
        },
      },
    );
  }
}

async function startSupport(ctx: MyContext) {
  const locale = getLocaleFromSession(ctx);
  ctx.session.step = 'awaiting_support_message';
  await ctx.reply(t(locale).support.prompt, {
    parse_mode: 'HTML',
    reply_markup: cancelKeyboard(locale),
  });
}

async function sendContact(ctx: MyContext) {
  const locale = getLocaleFromSession(ctx);
  const localeKey = (['uz', 'ru', 'en'] as const).includes(locale as LocaleKey)
    ? (locale as LocaleKey)
    : 'uz';
  const address = getAddress(localeKey);
  const hours = getWorkHours(localeKey);
  await ctx.reply(
    t(locale).contact.body(address, CONTACTS.phone.display, hours),
    {
      parse_mode: 'HTML',
      reply_markup: contactInlineMenu(
        locale,
        CONTACTS.phone.tel,
        CONTACTS.coords.lat,
        CONTACTS.coords.lng,
      ),
    },
  );
}

async function sendProfile(ctx: MyContext) {
  const locale = getLocaleFromSession(ctx);
  const tr = t(locale);
  const tgId = ctx.from?.id.toString();
  const client = await findClient(tgId);

  if (!client) {
    await ctx.reply(tr.profile.notRegistered);
    return;
  }

  const langNames = { uz: "O'zbekcha", ru: 'Русский', en: 'English' } as const;
  await ctx.reply(
    tr.profile.header(client.name || '-', client.phone, langNames[locale]),
    { parse_mode: 'HTML', reply_markup: languageMenu() },
  );
}

// ------------------------ Menu matching ------------------------

function matchesMenu(
  text: string,
  key: keyof typeof botMessages.uz.menu,
): boolean {
  for (const loc of ['uz', 'ru', 'en'] as BotLocale[]) {
    if (botMessages[loc].menu[key] === text) return true;
  }
  return false;
}

export { WEB_APP_URL };
