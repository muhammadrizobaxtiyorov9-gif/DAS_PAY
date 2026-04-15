import { Bot, Keyboard, InlineKeyboard, Context, SessionFlavor, session } from 'grammy';
import { prisma } from '../../lib/prisma';

const WEB_APP_URL = 'https://das-pay.com'; // O'zgartirishingiz mumkin

interface SessionData {
  step: 'idle' | 'calc_origin' | 'calc_dest' | 'calc_weight' | 'calc_phone';
  calcData: {
    origin?: string;
    destination?: string;
    weight?: string;
    estimate?: number;
  };
}

export type MyContext = Context & SessionFlavor<SessionData>;

function initial(): SessionData {
  return { step: 'idle', calcData: {} };
}

function getMainMenu(tgId: string | undefined = undefined) {
  const kb = new Keyboard()
    .text('📦 Yukni kuzatish').text('📋 Bizning xizmatlar').row()
    .text('💰 Kalkulyator').text('📞 Aloqa & Manzil').row()
    
  if (tgId) {
     kb.webApp('👤 Mening Kabinetim', `${WEB_APP_URL}/uz/cabinet?tgId=${tgId}`);
  } else {
     kb.webApp('🌐 Web-Ilova (DasPay)', WEB_APP_URL);
  }
  
  return kb.resized().persistent();
}

export function setupMessageHandlers(bot: Bot<MyContext>) {

  // Command: /start
  bot.command('start', async (ctx) => {
    ctx.session.step = 'idle';
    const firstName = ctx.from?.first_name || '';
    const tgId = ctx.from?.id.toString();
    
    // Check if client exists
    const client = await prisma.client.findFirst({
      where: { telegramId: tgId }
    });

    if (!client) {
      const contactBtn = new Keyboard().requestContact("📱 Raqamni tasdiqlash").resized().oneTime();
      await ctx.reply(`Assalomu alaykum <b>${firstName}</b>!\n\n🚚 <b>DasPay Logistika</b> tizimidan to'liq foydalanish, shaxsiy yuklaringizni kuzatish va kabinetga kirish uchun telefon raqamingizni tasdiqlang:`, {
        parse_mode: 'HTML',
        reply_markup: contactBtn
      });
    } else {
      await ctx.reply(`Xush kelibsiz <b>${firstName}</b>!\nQuyidagi menyudan kerakli bo'limni tanlang:`, {
        parse_mode: 'HTML',
        reply_markup: getMainMenu(tgId)
      });
    }
  });

  // Handling shared contact (Registration or Lead)
  bot.on('message:contact', async (ctx) => {
    const session = ctx.session;
    const phone = ctx.message.contact.phone_number.replace('+', '');
    const tgId = ctx.from?.id.toString() || '';
    const firstName = ctx.from?.first_name || '';

    if (session.step === 'calc_phone') {
      session.step = 'idle';
      try {
        await prisma.lead.create({
          data: {
             name: firstName, phone: phone,
             service: `Telegram Bot Kalkulyator (Og'irlik: ${session.calcData.weight}kg, Narx: $${session.calcData.estimate})`,
             message: `Yo'nalish: ${session.calcData.origin} -> ${session.calcData.destination}. Username: @${ctx.from?.username || ''}`,
             ip: "telegram", status: "new"
          }
        });
        await ctx.reply(`✅ Arizangiz muvaffaqiyatli qabul qilindi! Tez orada mutaxassislarimiz aloqaga chiqishadi.`, { reply_markup: getMainMenu(tgId) });
      } catch(e) {
         await ctx.reply(`⚠️ Xatolik yuz berdi.`, { reply_markup: getMainMenu(tgId) });
      }
    } else {
      // Registration Flow
      try {
        await prisma.client.upsert({
           where: { phone },
           update: { telegramId: tgId, name: firstName },
           create: { phone, telegramId: tgId, name: firstName }
        });
        await ctx.reply(`✅ Ro'yxatdan muvaffaqiyatli o'tdingiz!\nEndi "Mening Kabinetim" tugmasi orqali shaxsiy yuklaringizni to'g'ridan to'g'ri kuzatishingiz mumkin.`, {
           reply_markup: getMainMenu(tgId)
        });
      } catch(e) {
         console.error(e);
         await ctx.reply(`⚠️ Xatolik yuz berdi. Iltimos keyinroq urinib ko'ring.`);
      }
    }
  });

  // Event: Yukni kuzatish
  bot.hears('📦 Yukni kuzatish', async (ctx) => {
    ctx.session.step = 'idle';
    await ctx.reply(`📦 <b>Yukingizni kuzatish (Tracking)</b>\n\nYuk holatini bilish uchun quyidagi qutiga o'zingizning Treking raqamingizni yozib yuboring (Masalan: <code>DP-123456</code>).`, { parse_mode: 'HTML' });
  });

  // Event: Bizning xizmatlar 
  bot.hears('📋 Bizning xizmatlar', async (ctx) => {
    ctx.session.step = 'idle';
    const servicesMenu = new InlineKeyboard()
      .text('🌍 Xalqaro tashuvlar', 'service_international').row()
      .text('🗓 Ekspeditsiya', 'service_expedition').row()
      .text('📦 Omborxona xizmati', 'service_warehouse').row()
      .text('🛠 Vagonlarni ta\'mirlash', 'service_repair').row()
      .text('🚄 Vagon ijarasi', 'service_rent');

    await ctx.reply(`📋 Batafsil ma'lumot olish uchun tugmani tanlang:`, { reply_markup: servicesMenu });
  });

  // Event: Aloqa 
  bot.hears('📞 Aloqa & Manzil', async (ctx) => {
    ctx.session.step = 'idle';
    await ctx.reply(`📍 <b>Bosh ofisimiz:</b>\nг. Ташкент, Яшнабадский р-н, ул. Садыка Азимова, дом 68\n\n📞 <b>Aloqa uchun bo'lim:</b>\n+998 99 866 15 66`, { parse_mode: 'HTML' });
  });

  // Event: Kalkulyator (Start Lead Flow)
  bot.hears('💰 Kalkulyator', async (ctx) => {
    ctx.session.step = 'calc_origin';
    ctx.session.calcData = {};
    const inlineWait = new Keyboard().text('❌ Bekor qilish').resized();
    await ctx.reply(`💰 <b>Kalkulyator (Ariza qoldirish)</b>\n\nYuk qayerdan jo'natiladi? (Masalan: Xitoy, Pekin)`, { parse_mode: 'HTML', reply_markup: inlineWait });
  });

  bot.hears('❌ Bekor qilish', async (ctx) => {
    ctx.session.step = 'idle';
    await ctx.reply("Amaliyot bekor qilindi.", { reply_markup: getMainMenu(ctx.from?.id.toString()) });
  });

  // Native Tracking Logic
  bot.hears(/dp-\d+/i, async (ctx) => {
    ctx.session.step = 'idle';
    const code = ctx.match[0].toUpperCase();
    await ctx.replyWithChatAction('typing');
    try {
      const trackingData = await prisma.shipment.findUnique({ where: { trackingCode: code } });
      if (!trackingData) {
        await ctx.reply(`❌ Kechirasiz, <b>${code}</b> raqamli yuk topilmadi.`, { parse_mode: 'HTML' });
        return;
      }
      let eventsMsg = '';
      try {
        const events = typeof trackingData.events === 'string' ? JSON.parse(trackingData.events) : trackingData.events;
        if (Array.isArray(events) && events.length > 0) {
           eventsMsg = `\n\n<b>So'nggi holatlar:</b>\n`;
           events.slice(-3).forEach((e: any) => {
              const statusStr = e.status?.uz || e.status?.en || e.status || "Noma'lum";
              eventsMsg += `🔹 <b>${statusStr}</b> (${e.location || ''})\n   🕒 ${e.date || ''}\n`;
           });
        }
      } catch (e) {}

      let statusIcon = trackingData.status === 'in_transit' ? '🚚' : trackingData.status === 'delivered' ? '✅' : '📦';
      const msg = `${statusIcon} <b>Yuk ma'lumotlari: ${trackingData.trackingCode}</b>\n\n` +
                  `📍 <b>Qayerdan:</b> ${trackingData.origin}\n` +
                  `🏁 <b>Qayerga:</b> ${trackingData.destination}\n` +
                  `⚖️ <b>Og'irligi:</b> ${trackingData.weight || 'Noma\'lum'} kg\n` +
                  `📊 <b>Joriy Holat:</b> <b>${trackingData.status.toUpperCase()}</b>\n` +
                  `\n📅 <i>So'nggi yangilanish: ${trackingData.updatedAt.toISOString().slice(0, 16).replace('T', ' ')}</i>` + eventsMsg;

      const detailsBtn = new InlineKeyboard().webApp("Batafsil ko'rish", `${WEB_APP_URL}/uz/tracking/${trackingData.trackingCode}`);
      await ctx.reply(msg, { parse_mode: 'HTML', reply_markup: detailsBtn });
    } catch (err) {
      await ctx.reply("Xatolik yuz berdi.");
    }
  });

  // Conversation Fallback Catch-All
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text;
    const session = ctx.session;

    if (session.step === 'calc_origin') {
      session.calcData.origin = text; session.step = 'calc_dest';
      await ctx.reply("Yaxshi! Yuk qayerga yetkazilishi kerak?");
      return;
    }
    if (session.step === 'calc_dest') {
      session.calcData.destination = text; session.step = 'calc_weight';
      await ctx.reply("Yukning taxminiy og'irligini kiriting (kg):");
      return;
    }
    if (session.step === 'calc_weight') {
      const w = parseFloat(text);
      if (isNaN(w) || w <= 0) { await ctx.reply("To'g'ri raqam kiriting:"); return; }
      session.calcData.weight = text; session.step = 'calc_phone';
      const est = Math.round(w * 2.5);
      session.calcData.estimate = est;
      const contactBtn = new Keyboard().requestContact("📱 Raqamni yuborish").resized().oneTime();
      await ctx.reply(`Sizning yukingiz uchun taxminiy narx: <b>$${est} dan boshlanadi.</b>\n\nArizani tasdiqlash uchun telefon raqamingizni yuboring:`, { parse_mode: 'HTML', reply_markup: contactBtn });
      return;
    }
    if (session.step === 'calc_phone') {
       // Just in case they type it instead of sharing contact
       session.step = 'idle';
       const phone = text.replace('+', '');
       const tgId = ctx.from?.id.toString() || '';
       try {
         await prisma.lead.create({
           data: {
             name: ctx.from?.first_name || 'Telegram User', phone,
             service: `Telegram Bot Kalkulyator (Og'irlik: ${session.calcData.weight}kg, Narx: $${session.calcData.estimate})`,
             message: `Yo'nalish: ${session.calcData.origin} -> ${session.calcData.destination}. Username: @${ctx.from?.username || ''}`,
             ip: "telegram", status: "new"
           }
         });
         await ctx.reply(`✅ Arizangiz qabul qilindi.`, { reply_markup: getMainMenu(tgId) });
       } catch (err) {
         await ctx.reply(`⚠️ Xatolik yuz berdi.`, { reply_markup: getMainMenu(tgId) });
       }
       return;
    }
  });
  
  const callbacks: Record<string, string> = {
    'service_international': `🌍 <b>Xalqaro tashuvlar</b>\nBiz asosan Xitoy, Eron, Pokiston bilan ishlaymiz.`,
    'service_expedition': `🗓 <b>Ekspeditsiya Xizmatlari</b>\nKuzatuv ostida boshqarish.`,
    'service_warehouse': `📦 <b>Omborxona xizmati</b>\nZamonaviy va himoyalangan omborxonalar o'z xizmatingizda!`,
    'service_repair': `🛠 <b>Vagonlarni ta'mirlash</b>\nVagonlarni joriy va kapital ta'mirlash.`,
    'service_rent': `🚄 <b>Vagon ijarasi</b>\nVagon ijara xizmati mavjud.`
  };
  for (const [key, msg] of Object.entries(callbacks)) {
     bot.callbackQuery(key, async (ctx) => { await ctx.answerCallbackQuery(); await ctx.reply(msg, { parse_mode: 'HTML' }); });
  }
}
