export const CONTACTS = {
  phone: {
    display: '+998 95 558 00 07',
    tel: '+998955580007'
  },
  email: {
    display: 'info@das-pay.com',
    mailto: 'info@das-pay.com',
  },
  address: {
    uz: "Toshkent sh., Yashnabod tumani, Sodiq Azimov ko'chasi, 68-uy",
    ru: 'г. Ташкент, Яшнабадский р-н, ул. Садыка Азимова, 68',
    en: 'Tashkent, Yashnabad district, Sodiq Azimov street 68',
  },
  coords: {
    lat: 41.3022,
    lng: 69.3285,
  },
  workHours: {
    uz: 'Dush-Juma: 9:00–18:00',
    ru: 'Пн-Пт: 9:00–18:00',
    en: 'Mon-Fri: 9:00–18:00',
  },
  social: {
    telegram: 'https://t.me/daspaylogistics',
    instagram: 'https://www.instagram.com/daspaylogistics',
    linkedin: 'https://linkedin.com/company/daspaylogistics',
  },
  web: {
    url: 'https://das-pay.com',
    botUsername: 'daspaylogistics_bot',
  },
} as const;

export type LocaleKey = 'uz' | 'ru' | 'en';

export function getAddress(locale: LocaleKey) {
  return CONTACTS.address[locale] ?? CONTACTS.address.uz;
}

export function getWorkHours(locale: LocaleKey) {
  return CONTACTS.workHours[locale] ?? CONTACTS.workHours.uz;
}
