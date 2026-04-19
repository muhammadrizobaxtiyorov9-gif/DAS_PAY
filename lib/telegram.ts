/**
 * Telegram Bot utility for DasPay
 * Sends notifications to admin chat when forms are submitted
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

interface ContactNotification {
  name: string;
  phone: string;
  email?: string;
  service?: string;
  message: string;
}

/**
 * Send a message to the Telegram admin chat
 */
export async function sendTelegramMessage(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[Telegram] Bot token or chat ID not configured');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'HTML',
        }),
      }
    );

    const data = await response.json();
    
    if (!data.ok) {
      console.error('[Telegram] Failed to send message:', data.description);
      if (data.description?.includes('chat not found')) {
        console.error('[Telegram] Chat not found. Make sure you have started a conversation with the bot first by sending /start, and that TELEGRAM_CHAT_ID is correct.');
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Telegram] Error sending message:', error);
    return false;
  }
}

/**
 * Send a contact form notification to Telegram
 */
export async function sendContactNotification(data: ContactNotification): Promise<boolean> {
  const timestamp = new Date().toLocaleString('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const message = `
🚚 <b>Yangi so'rov — DasPay</b>

👤 <b>Ism:</b> ${escapeHtml(data.name)}
📞 <b>Telefon:</b> ${escapeHtml(data.phone)}
${data.email ? `📧 <b>Email:</b> ${escapeHtml(data.email)}` : ''}
${data.service ? `📦 <b>Xizmat:</b> ${escapeHtml(data.service)}` : ''}
💬 <b>Xabar:</b> ${escapeHtml(data.message)}

🕐 <b>Vaqt:</b> ${timestamp}
  `.trim();

  return sendTelegramMessage(message);
}

/**
 * Handle incoming Telegram webhook messages
 */
export async function handleTelegramWebhook(update: TelegramUpdate): Promise<string | null> {
  if (!update.message?.text) {
    return null;
  }

  const chatId = update.message.chat.id;
  const text = update.message.text;

  if (text === '/start') {
    return `
🚚 <b>DasPay Bot</b>ga xush kelibsiz!

Bu bot orqali siz:
• Yangi so'rovlar haqida xabar olasiz
• Yuklar holati haqida ma'lumot olishingiz mumkin

Yordam uchun /help buyrug'ini yuboring.
    `.trim();
  }

  if (text === '/help') {
    return `
📖 <b>Mavjud buyruqlar:</b>

/start - Botni ishga tushirish
/help - Yordam ko'rsatish
/status - Bot holati

Savollar uchun: info@das-pay.com
    `.trim();
  }

  if (text === '/status') {
    return `
✅ <b>Bot holati:</b> Faol
🕐 <b>Server vaqti:</b> ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}
    `.trim();
  }

  return null;
}

/**
 * Send a message to a specific Telegram chat (client notifications)
 * Supports HTML parse_mode and optional inline keyboard.
 */
export async function sendTelegramToChat(
  chatId: string | number,
  text: string,
  options: { replyMarkup?: unknown; disableWebPreview?: boolean } = {},
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: options.disableWebPreview ?? true,
          reply_markup: options.replyMarkup,
        }),
      },
    );
    const data = await res.json();
    if (!data.ok) {
      console.warn('[Telegram] sendTelegramToChat failed:', data.description);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Telegram] sendTelegramToChat error:', err);
    return false;
  }
}

/**
 * Reply to a Telegram message
 */
export async function replyToTelegram(chatId: number, text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      }
    );

    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error('[Telegram] Error replying:', error);
    return false;
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Telegram update types
 */
interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
}

export type { TelegramUpdate, ContactNotification };
