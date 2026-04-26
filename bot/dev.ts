import 'dotenv/config';
import { Bot, session } from 'grammy';
import { setupMessageHandlers, MyContext, initial } from './handlers/message';
import { setupStaffCommands } from './handlers/admin-driver';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

if (!TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN topilmadi.');
  process.exit(1);
}

const bot = new Bot<MyContext>(TELEGRAM_BOT_TOKEN);

bot.use(session({ initial }));

setupMessageHandlers(bot);
setupStaffCommands(bot);

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
  { command: 'invoice', description: "To'lanmagan hisoblar / Unpaid invoices" },
  { command: 'status', description: 'Driver: hozirgi yuk holati' },
  { command: 'stats', description: 'Admin: kunlik statistika' },
  { command: 'lang', description: 'Til / Language' },
  { command: 'help', description: 'Yordam / Help' },
]).catch((e) => console.warn('[Bot] setMyCommands failed:', e));

console.log('🤖 Bot polling rejimida ishga tushdi...');
bot.start();
