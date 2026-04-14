import 'dotenv/config'; 
import { Bot } from 'grammy';
import { setupMessageHandlers } from './handlers/message';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

if (!TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN topilmadi.');
  process.exit(1);
}

const bot = new Bot(TELEGRAM_BOT_TOKEN);

setupMessageHandlers(bot);

bot.catch((err) => {
  console.error('[Bot Error]', err);
});

console.log('🤖 Bot Polling rejimida ishga tushdi...');
bot.start();
