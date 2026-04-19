/**
 * Email utility for DasPay
 * Sends notification emails when forms are submitted
 */

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface ContactEmailData {
  name: string;
  phone: string;
  email?: string;
  service?: string;
  message: string;
}

/**
 * Send an email using Nodemailer-compatible SMTP
 * Falls back to logging if SMTP is not configured
 */
export async function sendEmail(data: EmailData): Promise<boolean> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log('[Email] SMTP not configured, logging email instead:');
    console.log(`  To: ${data.to}`);
    console.log(`  Subject: ${data.subject}`);
    console.log(`  Body: ${data.text || data.html.substring(0, 200)}...`);
    return true;
  }

  try {
    // Use fetch to send via a simple mail API or implement SMTP
    // For production, use nodemailer or a service like Resend, SendGrid
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '587'),
      secure: SMTP_PORT === '465',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"DasPay" <${SMTP_USER}>`,
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
    });

    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return false;
  }
}

/**
 * Send a contact form notification email
 */
export async function sendContactEmail(data: ContactEmailData): Promise<boolean> {
  const timestamp = new Date().toLocaleString('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #1E293B; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #042C53; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #F8FAFC; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #042C53; }
    .value { margin-top: 5px; }
    .footer { text-align: center; padding: 20px; color: #64748B; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>DasPay - Yangi So'rov</h1>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Ism:</div>
        <div class="value">${escapeHtml(data.name)}</div>
      </div>
      <div class="field">
        <div class="label">Telefon:</div>
        <div class="value">${escapeHtml(data.phone)}</div>
      </div>
      ${data.email ? `
      <div class="field">
        <div class="label">Email:</div>
        <div class="value">${escapeHtml(data.email)}</div>
      </div>
      ` : ''}
      ${data.service ? `
      <div class="field">
        <div class="label">Xizmat turi:</div>
        <div class="value">${escapeHtml(data.service)}</div>
      </div>
      ` : ''}
      <div class="field">
        <div class="label">Xabar:</div>
        <div class="value">${escapeHtml(data.message)}</div>
      </div>
    </div>
    <div class="footer">
      <p>Bu xabar ${timestamp} da yuborildi.</p>
      <p>DasPay Logistika</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Yangi so'rov - DasPay

Ism: ${data.name}
Telefon: ${data.phone}
${data.email ? `Email: ${data.email}` : ''}
${data.service ? `Xizmat: ${data.service}` : ''}
Xabar: ${data.message}

Yuborilgan vaqt: ${timestamp}
  `.trim();

  return sendEmail({
    to: process.env.SMTP_USER || 'info@das-pay.com',
    subject: `Yangi so'rov: ${data.name}`,
    html,
    text,
  });
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export type { EmailData, ContactEmailData };
