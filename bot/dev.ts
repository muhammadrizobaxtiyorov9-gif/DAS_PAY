import 'dotenv/config';
import { Bot, session } from 'grammy';
import { setupMessageHandlers, MyContext, initial } from './handlers/message';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

if (!TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN topilmadi.');
  process.exit(1);
}

const bot = new Bot<MyContext>(TELEGRAM_BOT_TOKEN);

bot.use(session({ initial }));

setupMessageHandlers(bot);

bot.catch((err) => {
  console.error('[Bot Error]', err);
});

bot.api.setMyCommands([
  { command: 'start', description: 'Botni ishga tushirish / Start' },
  { command: 'track', description: 'Yukni kuzatish / Track shipment' },
  { command: 'shipments', description: 'Mening yuklarim / My shipments' },
  { command: 'calc', description: 'Narx kalkulyatori / Price calculator' },
  { command: 'services', description: 'Xizmatlar / Services' },
  { command: 'contact', description: 'Aloqa / Contacts' },
  { command: 'support', description: "Qo'llab-quvvatlash / Support" },
  { command: 'pay', description: "To'lov / Pay invoices" },
  { command: 'lang', description: 'Til / Language' },
  { command: 'help', description: 'Yordam / Help' },
]).catch((e) => console.warn('[Bot] setMyCommands failed:', e));

console.log('🤖 Bot polling rejimida ishga tushdi...');
bot.start();
