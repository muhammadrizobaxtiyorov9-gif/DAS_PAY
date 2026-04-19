import { Keyboard, InlineKeyboard } from 'grammy';
import { t, type BotLocale } from './i18n';

const WEB_APP_URL = process.env.BOT_WEB_APP_URL || 'https://das-pay.com';

export function mainMenu(locale: BotLocale, tgId?: string) {
  const m = t(locale).menu;
  const kb = new Keyboard()
    .text(m.track).text(m.myShipments).row()
    .text(m.calculator).text(m.services).row()
    .text(m.support).text(m.contact).row()
    .text(m.profile).text(m.language).row();

  if (tgId) {
    kb.webApp(m.cabinet, `${WEB_APP_URL}/uz/cabinet?tgId=${tgId}`);
  } else {
    kb.webApp(m.website, WEB_APP_URL);
  }

  return kb.resized().persistent();
}

export function servicesMenu(locale: BotLocale) {
  const items = t(locale).services.items;
  return new InlineKeyboard()
    .text(items.international.title, 'service_international').row()
    .text(items.expedition.title, 'service_expedition').row()
    .text(items.warehouse.title, 'service_warehouse').row()
    .text(items.repair.title, 'service_repair').row()
    .text(items.rent.title, 'service_rent');
}

export function cancelKeyboard(locale: BotLocale) {
  return new Keyboard().text(t(locale).menu.cancel).resized();
}

export function contactShareKeyboard(label: string) {
  return new Keyboard().requestContact(label).resized().oneTime();
}

export function shipmentInlineMenu(code: string, locale: BotLocale) {
  const m = t(locale).track;
  return new InlineKeyboard()
    .webApp(m.viewOnWeb, `${WEB_APP_URL}/${locale}/tracking/${code}`).row()
    .webApp(m.viewOnMap, `${WEB_APP_URL}/${locale}/tracking/${code}#map`);
}

export function languageMenu() {
  return new InlineKeyboard()
    .text('🇺🇿 O\'zbekcha', 'set_lang_uz')
    .text('🇷🇺 Русский', 'set_lang_ru')
    .text('🇬🇧 English', 'set_lang_en');
}

export function contactInlineMenu(locale: BotLocale, phone: string, lat: number, lng: number) {
  const m = t(locale).contact;
  return new InlineKeyboard()
    .url(m.callBtn, `tel:${phone}`).row()
    .url(m.mapBtn, `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`).row()
    .url(m.webBtn, WEB_APP_URL);
}

export { WEB_APP_URL };
