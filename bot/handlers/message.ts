import { Bot, Keyboard, InlineKeyboard } from 'grammy';

const WEB_APP_URL = 'https://das-pay.com'; // O'zgartirishingiz mumkin

export function setupMessageHandlers(bot: Bot) {

  // Asosiy Menyu Keyboard
  const mainMenu = new Keyboard()
    .text('📦 Yukni kuzatish').text('📋 Bizning xizmatlar').row()
    .text('💰 Kalkulyator').text('📞 Aloqa & Manzil').row()
    .webApp('🌐 Web-Ilova (DasPay)', WEB_APP_URL)
    .resized()
    .persistent(); // Helps with sticky keyboard

  // Command: /start
  bot.command('start', async (ctx) => {
    const firstName = ctx.from?.first_name || '';
    await ctx.reply(`Assalomu alaykum <b>${firstName}</b>! 

🚚 <b>DasPay Logistika</b> kompaniyasining rasmiy botiga xush kelibsiz.
Iltimos, o'zingizga kerakli bo'limni tanlang:`, {
      parse_mode: 'HTML',
      reply_markup: mainMenu
    });
  });

  // Event: Yukni kuzatish
  bot.hears('📦 Yukni kuzatish', async (ctx) => {
    await ctx.reply(`📦 <b>Yukingizni kuzatish (Tracking)</b>

Yuk holatini bilish uchun quyidagi qutiga o'zingizning Treking / Deklaratsiya raqamingizni yozib yuboring (Masalan: <code>DP-123456</code>). Yoki bizning <a href="${WEB_APP_URL}">Mini-Ilovamiz</a> orqali oson shaxsiy kabinetingizga kiring.`, {
      parse_mode: 'HTML',
    });
  });

  // Event: Bizning xizmatlar (Inline Keyboard)
  bot.hears('📋 Bizning xizmatlar', async (ctx) => {
    const servicesMenu = new InlineKeyboard()
      .text('🌍 Xalqaro tashuvlar', 'service_international').row()
      .text('🗓 Ekspeditsiya', 'service_expedition').row()
      .text('📦 Omborxona xizmati', 'service_warehouse').row()
      .text('🛠 Vagonlarni ta\'mirlash', 'service_repair').row()
      .text('🚄 Vagon ijarasi', 'service_rent');

    await ctx.reply(`📋 <b>DasPay</b> kompaniyasi O'zbekistonda 10+ yil amaliy tajribaga ega bo'lib, quyidagi yo'nalishlarda professional xizmat ko'rsatadi.

Batafsil ma'lumot olish uchun quyidagi tugmalardan birini tanlang:`, {
      parse_mode: 'HTML',
      reply_markup: servicesMenu
    });
  });

  // Event: Inline button callbacks (Xizmatlar ma'lumotlari)
  bot.callbackQuery('service_international', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(`🌍 <b>Xalqaro tashuvlar</b>
Biz asosan quyidagi davlatlar bilan ishlaymiz: Xitoy, Eron, Pokiston, Afg'oniston va MDH davlatlari.
Tashuvlarimiz Avtomobil, Avia, hamda Temir yo'l (MDH / Xitoy) orqali professional xavfsizlik bilan amalga oshiriladi. 
Narxlar kelishilgan holda eng arzon tarifda belgilanadi.
`, { parse_mode: 'HTML' });
  });

  bot.callbackQuery('service_expedition', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(`🗓 <b>Ekspeditsiya Xizmatlari</b>
Yuklaringizni to'liq ishonchli kuzatuv ostida boshqarish. Kargo jo'natishdan to manziligacha obyektiv monitoring va bojxonada yordam ishlari.`, { parse_mode: 'HTML' });
  });

  bot.callbackQuery('service_warehouse', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(`📦 <b>Omborxona xizmati (Складские услуги)</b>
Toshkentda zamonaviy va himoyalangan omborxonalar o'z xizmatingizda!
- Tovarlarni qabul qilish va tarqatish.
- Konsolidatsiya, sortirovka va markirovka.
- Qayta upakovka qilish.`, { parse_mode: 'HTML' });
  });

  bot.callbackQuery('service_repair', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(`🛠 <b>Vagonlarni ta'mirlash (Ремонт вагонов)</b>
Temir yo'l yuk tashuvchi vagonlarini joriy va kapital ta'mirlash ishlarini professional mutaxassislar orqali amalga oshiramiz. Vaqt - qisqa, Sifat - kafolatlangan!`, { parse_mode: 'HTML' });
  });

  bot.callbackQuery('service_rent', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(`🚄 <b>Vagon ijarasi (Аренда вагонов)</b>
Yirik va og'ir yuklar, katta masshtabdagi import/eksport yuklari bo'yicha vagonga talab bo'lsa, optimal narxlarda kerakli tipdagi bo'sh vagonlarni ijara yoki taqdim etish ishlarini ko'rib chiqamiz.`, { parse_mode: 'HTML' });
  });

  // Event: Kalkulyator
  bot.hears('💰 Kalkulyator', async (ctx) => {
    const inlineCalc = new InlineKeyboard().webApp('Kalkulyatordan foydalanish ⚡️', WEB_APP_URL);
    await ctx.reply(`💰 <b>Yuk yetkazib berish kalkulyatori</b>

Aniq tarif va muddatni hisoblash uchun bizning veb sahifadagi qulay kalkulyatordan foydalaning:`, {
      parse_mode: 'HTML',
      reply_markup: inlineCalc
    });
  });

  // Event: Aloqa 
  bot.hears('📞 Aloqa & Manzil', async (ctx) => {
    await ctx.reply(`📍 <b>Bosh ofisimiz:</b>
г. Ташкент, Яшнабадский р-н, ул. Садыка Азимова, дом 68

📞 <b>Aloqa uchun bo'lim:</b>
+998 99 866 15 66
info@das-pay.com

🕒 <b>Ish vaqti:</b>
Dusha-Shan 09:00 - 18:00 (O'zbekiston vaqti bilan)

👤 Zudlik bilan yordam kerak bo'lsa @daspay_manager (<i>yoki xozirgi raqam telegrami</i>) profiliga yozishingiz mumkin.`, { parse_mode: 'HTML' });
  });

  // Event: Fallback matcher for tracking numbers (Masalan dp-122 qidirilsa)
  bot.hears(/dp-\d+/i, async (ctx) => {
    const code = ctx.match[0].toUpperCase();
    await ctx.reply(`🔍 <b>${code}</b> treking kodi bo'yicha bazada ma'lumot izlanmoqda...

🔄 Iltimos kuting yoki ro'yhatdan o'tib tizimda ko'ring.`, { parse_mode: 'HTML' });
  });
}
