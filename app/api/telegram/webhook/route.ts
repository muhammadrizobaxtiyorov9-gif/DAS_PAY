import { NextRequest, NextResponse } from 'next/server';
import { Bot, session } from 'grammy';
import { setupMessageHandlers, MyContext } from '@/bot/handlers/message';

// Tokenni tekshiramiz
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const bot = new Bot<MyContext>(TELEGRAM_BOT_TOKEN);

bot.use(session({ initial: () => ({ step: 'idle', calcData: {} }) }));

// Barcha handlerlarni yuklash (start, help, AI)
setupMessageHandlers(bot);

// QAYD: Xatosiz ishlashi uchun barcha throw error'larni e'tiborsiz qoldiradigan error boundary qo'shamiz
bot.catch((err) => {
  console.error('[Grammy Error]', err);
});

export async function POST(request: NextRequest) {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      console.warn('TELEGRAM_BOT_TOKEN .env faylida yo\'q!');
      return NextResponse.json({ ok: false, error: 'Token missing' }, { status: 500 });
    }

    // Telegramdan kelgan update'ni o'qib olamiz
    const update = await request.json();

    if (update) {
      // Grammy botga update ni manually yuboramiz
      await bot.handleUpdate(update);
    }

    // Telegramga xabar muvaffaqiyatli yetib borganini bildirish uchun 200 OK qaytariladi
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Telegram Webhook Error]:', error);
    // Hatto xato bo'lsa ham Telegram yana qayta jo'natmasligi uchun 200 OK qaytarish afzal,
    // lekin logda xatoni ko'ramiz
    return NextResponse.json({ ok: true, error: 'Internal logic err' });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'DasPay Telegram AI Bot API is active',
  });
}
