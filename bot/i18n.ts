export type BotLocale = 'uz' | 'ru' | 'en';

export interface BotMessages {
  start: {
    welcome: (name: string) => string;
    welcomeBack: (name: string) => string;
    askPhone: string;
    registered: string;
    error: string;
  };
  menu: {
    track: string;
    services: string;
    calculator: string;
    myShipments: string;
    support: string;
    contact: string;
    profile: string;
    language: string;
    cabinet: string;
    website: string;
    cancel: string;
    back: string;
  };
  track: {
    prompt: string;
    notFound: (code: string) => string;
    card: (s: ShipmentLike) => string;
    viewOnWeb: string;
    viewOnMap: string;
  };
  shipments: {
    empty: string;
    header: (n: number) => string;
  };
  services: {
    intro: string;
    items: {
      international: { title: string; body: string };
      expedition: { title: string; body: string };
      warehouse: { title: string; body: string };
      repair: { title: string; body: string };
      rent: { title: string; body: string };
    };
  };
  calc: {
    start: string;
    askDest: string;
    askWeight: string;
    invalidWeight: string;
    askPhone: (origin: string, dest: string, weight: string, est: number) => string;
    submitted: string;
    cancelled: string;
  };
  contact: {
    body: (address: string, phone: string, hours: string) => string;
    callBtn: string;
    mapBtn: string;
    webBtn: string;
  };
  support: {
    prompt: string;
    submitted: string;
  };
  profile: {
    header: (name: string, phone: string, lang: string) => string;
    changeLang: string;
    notRegistered: string;
  };
  lang: {
    prompt: string;
    changed: string;
  };
  fallback: string;
  help: string;
}

export const botMessages: Record<BotLocale, BotMessages> = {
  uz: {
    start: {
      welcome: (name: string) =>
        `👋 Assalomu alaykum, <b>${name}</b>!\n\n🚚 <b>DasPay Logistika</b> — Xitoy, Rossiya, Eron va Markaziy Osiyo bo'ylab yuklarni muddatida yetkazib beradigan xalqaro transport-ekspeditor kompaniyasi.\n\n✨ <b>Biz orqali siz:</b>\n• Real vaqtda yukni kuzatasiz\n• Narxni kalkulyator orqali hisoblaysiz\n• Shaxsiy kabinetda tarixni ko'rasiz\n• Mutaxassisdan bevosita yordam olasiz\n\nBoshlash uchun telefon raqamingizni tasdiqlang 👇`,
      welcomeBack: (name: string) =>
        `👋 Xush kelibsiz, <b>${name}</b>!\n\nQuyidagi menyudan kerakli bo'limni tanlang 👇`,
      askPhone: '📱 Telefon raqamingizni tasdiqlash uchun pastdagi tugmani bosing:',
      registered:
        "✅ Ro'yxatdan muvaffaqiyatli o'tdingiz!\n\nEndi <b>👤 Mening Kabinetim</b> tugmasi orqali shaxsiy yuklaringizni kuzatishingiz mumkin.",
      error: '⚠️ Xatolik yuz berdi. Iltimos keyinroq urinib ko\'ring.',
    },
    menu: {
      track: '📦 Yukni kuzatish',
      services: '📋 Xizmatlar',
      calculator: '💰 Kalkulyator',
      myShipments: '🚚 Yuklarim',
      support: '💬 Qo\'llab-quvvatlash',
      contact: '📞 Aloqa',
      profile: '⚙️ Profil',
      language: '🌐 Til / Язык',
      cabinet: '👤 Mening Kabinetim',
      website: '🌐 Web-sayt',
      cancel: '❌ Bekor qilish',
      back: '⬅️ Orqaga',
    },
    track: {
      prompt:
        "📦 <b>Yukni kuzatish</b>\n\nYuk holatini bilish uchun treking raqamingizni yuboring.\n\n<i>Masalan:</i> <code>DP-123456</code>",
      notFound: (code: string) =>
        `❌ <b>${code}</b> raqamli yuk topilmadi.\n\nTreking raqamni tekshirib qayta yuboring.`,
      card: (s: ShipmentLike) => renderShipmentCardUz(s),
      viewOnWeb: '🌐 Saytda ko\'rish',
      viewOnMap: '🗺 Xaritada ko\'rish',
    },
    shipments: {
      empty:
        "📭 Sizda hali yuklar mavjud emas.\n\nYangi yuk rasmiylashtirish uchun <b>Kalkulyator</b> orqali ariza qoldiring yoki bosh ofisga murojaat qiling.",
      header: (n: number) => `🚚 <b>Sizning yuklaringiz (${n} ta)</b>`,
    },
    services: {
      intro: "📋 Quyidagi xizmatlarimizdan birini tanlang:",
      items: {
        international: {
          title: '🌍 Xalqaro tashuvlar',
          body:
            "🌍 <b>Xalqaro yuk tashish</b>\n\n• Xitoy, Rossiya, Eron, Turkiya yo'nalishlari\n• Avtomobil, temir yo'l va aralash qatnovlar\n• Bojxona rasmiylashtirish va hujjatlar\n• Yetkazishni kafolat bilan ta'minlaymiz",
        },
        expedition: {
          title: '🗓 Ekspeditsiya',
          body:
            "🗓 <b>Ekspeditsiya xizmatlari</b>\n\n• Yukni kuzatish va operativ boshqaruv\n• Har bir bosqichda hisobot\n• Manzilga optimal yo'nalish tanlash",
        },
        warehouse: {
          title: '📦 Omborxona',
          body:
            "📦 <b>Zamonaviy omborxona</b>\n\n• 24/7 himoyalangan joy\n• Inventar hisobi va saralash\n• Konsolidatsiya va qayta joylashtirish",
        },
        repair: {
          title: '🛠 Vagon ta\'mirlash',
          body:
            "🛠 <b>Vagonlarni ta'mirlash</b>\n\n• Joriy va kapital ta'mir\n• Sertifikatlangan ustaxonalar\n• Tezkor xizmat ko'rsatish",
        },
        rent: {
          title: '🚄 Vagon ijarasi',
          body:
            "🚄 <b>Vagon ijarasi</b>\n\n• Platforma, yarim vagon, konteyner\n• Qisqa va uzoq muddatga\n• Raqobatbardosh narxlar",
        },
      },
    },
    calc: {
      start:
        "💰 <b>Narx Kalkulyatori</b>\n\nYuk <b>qayerdan</b> jo'natiladi?\n\n<i>Masalan:</i> Xitoy, Pekin",
      askDest: "✅ Qabul qilindi.\n\nYuk <b>qayerga</b> yetkazilishi kerak?",
      askWeight:
        "⚖️ Yukning taxminiy <b>og'irligini</b> kiriting (tonna):\n\n<i>Masalan:</i> 20",
      invalidWeight: "⚠️ To'g'ri raqam kiriting (masalan 500):",
      askPhone: (origin: string, dest: string, weight: string, est: number) =>
        `💡 <b>Taxminiy hisob</b>\n\n📍 Yo'nalish: ${origin} → ${dest}\n⚖️ Og'irlik: ${weight} tonna\n💵 <b>Taxminiy narx: $${est} dan boshlab</b>\n\n<i>Aniq narx mutaxassislarimiz tomonidan sizga telefon orqali aytiladi.</i>\n\nArizani tasdiqlash uchun telefon raqamingizni yuboring 👇`,
      submitted:
        "✅ Arizangiz muvaffaqiyatli qabul qilindi!\n\nMenejerlarimiz <b>1 soat ichida</b> siz bilan bog'lanadi.",
      cancelled: 'Amaliyot bekor qilindi.',
    },
    contact: {
      body: (address: string, phone: string, hours: string) =>
        `📍 <b>Bosh ofis:</b>\n${address}\n\n📞 <b>Telefon:</b>\n${phone}\n\n🕒 <b>Ish vaqti:</b>\n${hours}`,
      callBtn: '📞 Qo\'ng\'iroq qilish',
      mapBtn: '🗺 Xaritada ko\'rish',
      webBtn: '🌐 Sayt',
    },
    support: {
      prompt:
        "💬 <b>Qo'llab-quvvatlash</b>\n\nSavolingiz yoki talabingizni yozing. Mutaxassislarimiz tez orada javob qaytaradi.",
      submitted:
        "✅ Murojaatingiz qabul qilindi!\nBirinchi imkoniyatda siz bilan bog'lanamiz.",
    },
    profile: {
      header: (name: string, phone: string, lang: string) =>
        `⚙️ <b>Profil</b>\n\n👤 Ism: ${name}\n📱 Telefon: ${phone}\n🌐 Til: ${lang}`,
      changeLang: '🌐 Tilni o\'zgartirish',
      notRegistered:
        'Hali ro\'yxatdan o\'tmagansiz. /start buyrug\'ini bosing.',
    },
    lang: {
      prompt: 'Kerakli tilni tanlang:',
      changed: '✅ Til muvaffaqiyatli o\'zgartirildi.',
    },
    fallback:
      "🤔 Tushunmadim. Quyidagi menyudan tanlang yoki /help buyrug'ini bosing.",
    help:
      "<b>📘 Yordam</b>\n\n/start — Botni qayta ishga tushirish\n/track — Yukni kuzatish\n/services — Xizmatlar\n/calc — Narx kalkulyatori\n/shipments — Mening yuklarim\n/support — Qo'llab-quvvatlash\n/contact — Aloqa ma'lumotlari\n/lang — Til tanlash\n\n🤝 <i>Hujjatli savollar uchun bosh ofisga murojaat qiling.</i>",
  },
  ru: {
    start: {
      welcome: (name: string) =>
        `👋 Здравствуйте, <b>${name}</b>!\n\n🚚 <b>DasPay Логистика</b> — международная транспортно-экспедиционная компания, доставляющая грузы из Китая, России, Ирана и по Центральной Азии.\n\n✨ <b>С нами вы:</b>\n• Отслеживаете груз в реальном времени\n• Рассчитываете стоимость в калькуляторе\n• Видите историю в личном кабинете\n• Напрямую общаетесь с менеджером\n\nПодтвердите номер телефона, чтобы начать 👇`,
      welcomeBack: (name: string) =>
        `👋 С возвращением, <b>${name}</b>!\n\nВыберите нужный раздел меню 👇`,
      askPhone: '📱 Нажмите кнопку ниже, чтобы подтвердить номер телефона:',
      registered:
        '✅ Вы успешно зарегистрированы!\n\nТеперь через <b>👤 Мой кабинет</b> вы можете отслеживать свои грузы.',
      error: '⚠️ Произошла ошибка. Попробуйте позже.',
    },
    menu: {
      track: '📦 Отследить груз',
      services: '📋 Услуги',
      calculator: '💰 Калькулятор',
      myShipments: '🚚 Мои грузы',
      support: '💬 Поддержка',
      contact: '📞 Контакты',
      profile: '⚙️ Профиль',
      language: '🌐 Til / Язык',
      cabinet: '👤 Мой кабинет',
      website: '🌐 Веб-сайт',
      cancel: '❌ Отменить',
      back: '⬅️ Назад',
    },
    track: {
      prompt:
        '📦 <b>Отслеживание груза</b>\n\nОтправьте трек-номер, чтобы узнать статус.\n\n<i>Пример:</i> <code>DP-123456</code>',
      notFound: (code: string) =>
        `❌ Груз с номером <b>${code}</b> не найден.\n\nПроверьте номер и попробуйте снова.`,
      card: (s: ShipmentLike) => renderShipmentCardRu(s),
      viewOnWeb: '🌐 Открыть на сайте',
      viewOnMap: '🗺 Показать на карте',
    },
    shipments: {
      empty:
        '📭 У вас пока нет грузов.\n\nОставьте заявку через <b>Калькулятор</b> или свяжитесь с офисом.',
      header: (n: number) => `🚚 <b>Ваши грузы (${n})</b>`,
    },
    services: {
      intro: '📋 Выберите услугу:',
      items: {
        international: {
          title: '🌍 Международные перевозки',
          body:
            '🌍 <b>Международные перевозки</b>\n\n• Китай, Россия, Иран, Турция\n• Авто, ж/д и мультимодальные перевозки\n• Таможенное оформление\n• Гарантируем сроки доставки',
        },
        expedition: {
          title: '🗓 Экспедиция',
          body:
            '🗓 <b>Экспедиционные услуги</b>\n\n• Сопровождение груза и управление\n• Отчёты на каждом этапе\n• Оптимальный маршрут',
        },
        warehouse: {
          title: '📦 Склад',
          body:
            '📦 <b>Современный склад</b>\n\n• Охраняемая территория 24/7\n• Инвентаризация и сортировка\n• Консолидация и перегрузка',
        },
        repair: {
          title: '🛠 Ремонт вагонов',
          body:
            '🛠 <b>Ремонт вагонов</b>\n\n• Текущий и капитальный ремонт\n• Сертифицированные мастерские\n• Оперативное обслуживание',
        },
        rent: {
          title: '🚄 Аренда вагонов',
          body:
            '🚄 <b>Аренда вагонов</b>\n\n• Платформы, полувагоны, контейнеры\n• Краткосрочная и долгосрочная аренда\n• Конкурентные цены',
        },
      },
    },
    calc: {
      start:
        '💰 <b>Калькулятор стоимости</b>\n\nОткуда отправляется груз?\n\n<i>Пример:</i> Китай, Пекин',
      askDest: '✅ Принято.\n\nКуда нужно доставить груз?',
      askWeight: '⚖️ Укажите примерный <b>вес</b> груза (тонн):\n\n<i>Пример:</i> 20',
      invalidWeight: '⚠️ Введите корректное число (например 500):',
      askPhone: (origin: string, dest: string, weight: string, est: number) =>
        `💡 <b>Предварительный расчёт</b>\n\n📍 Маршрут: ${origin} → ${dest}\n⚖️ Вес: ${weight} т\n💵 <b>От $${est}</b>\n\n<i>Точную цену менеджер сообщит по телефону.</i>\n\nОтправьте свой номер телефона для подтверждения 👇`,
      submitted:
        '✅ Заявка принята!\n\nМенеджер свяжется с вами <b>в течение часа</b>.',
      cancelled: 'Операция отменена.',
    },
    contact: {
      body: (address: string, phone: string, hours: string) =>
        `📍 <b>Главный офис:</b>\n${address}\n\n📞 <b>Телефон:</b>\n${phone}\n\n🕒 <b>Часы работы:</b>\n${hours}`,
      callBtn: '📞 Позвонить',
      mapBtn: '🗺 На карте',
      webBtn: '🌐 Сайт',
    },
    support: {
      prompt:
        '💬 <b>Поддержка</b>\n\nНапишите ваш вопрос или запрос. Наши специалисты ответят в ближайшее время.',
      submitted: '✅ Обращение принято!\nМы свяжемся с вами как можно скорее.',
    },
    profile: {
      header: (name: string, phone: string, lang: string) =>
        `⚙️ <b>Профиль</b>\n\n👤 Имя: ${name}\n📱 Телефон: ${phone}\n🌐 Язык: ${lang}`,
      changeLang: '🌐 Сменить язык',
      notRegistered: 'Вы ещё не зарегистрированы. Нажмите /start.',
    },
    lang: {
      prompt: 'Выберите язык:',
      changed: '✅ Язык успешно изменён.',
    },
    fallback:
      '🤔 Не понял. Выберите пункт в меню или нажмите /help.',
    help:
      "<b>📘 Помощь</b>\n\n/start — Перезапустить бот\n/track — Отследить груз\n/services — Услуги\n/calc — Калькулятор\n/shipments — Мои грузы\n/support — Поддержка\n/contact — Контакты\n/lang — Выбрать язык",
  },
  en: {
    start: {
      welcome: (name: string) =>
        `👋 Hello, <b>${name}</b>!\n\n🚚 <b>DasPay Logistics</b> is an international transport & forwarding company delivering cargo across China, Russia, Iran and Central Asia.\n\n✨ <b>With us you can:</b>\n• Track shipments in real time\n• Calculate pricing instantly\n• View your history in the personal cabinet\n• Chat directly with a manager\n\nPlease confirm your phone to continue 👇`,
      welcomeBack: (name: string) =>
        `👋 Welcome back, <b>${name}</b>!\n\nChoose a section from the menu 👇`,
      askPhone: '📱 Tap the button below to share your phone:',
      registered:
        '✅ You\'re registered!\n\nTap <b>👤 My Cabinet</b> to track your shipments.',
      error: '⚠️ Something went wrong. Please try again later.',
    },
    menu: {
      track: '📦 Track shipment',
      services: '📋 Services',
      calculator: '💰 Calculator',
      myShipments: '🚚 My shipments',
      support: '💬 Support',
      contact: '📞 Contacts',
      profile: '⚙️ Profile',
      language: '🌐 Language',
      cabinet: '👤 My Cabinet',
      website: '🌐 Website',
      cancel: '❌ Cancel',
      back: '⬅️ Back',
    },
    track: {
      prompt:
        '📦 <b>Shipment tracking</b>\n\nSend your tracking number to see the status.\n\n<i>Example:</i> <code>DP-123456</code>',
      notFound: (code: string) =>
        `❌ Shipment <b>${code}</b> not found.\n\nPlease double-check the number and try again.`,
      card: (s: ShipmentLike) => renderShipmentCardEn(s),
      viewOnWeb: '🌐 Open on website',
      viewOnMap: '🗺 View on map',
    },
    shipments: {
      empty:
        '📭 You don\'t have any shipments yet.\n\nSubmit a request via <b>Calculator</b> or call the main office.',
      header: (n: number) => `🚚 <b>Your shipments (${n})</b>`,
    },
    services: {
      intro: '📋 Pick a service:',
      items: {
        international: {
          title: '🌍 International transport',
          body:
            '🌍 <b>International freight</b>\n\n• China, Russia, Iran, Turkey\n• Road, rail and multimodal\n• Customs clearance & documents\n• Guaranteed delivery',
        },
        expedition: {
          title: '🗓 Expedition',
          body:
            '🗓 <b>Expedition services</b>\n\n• End-to-end cargo supervision\n• Real-time status reports\n• Optimal routing',
        },
        warehouse: {
          title: '📦 Warehouse',
          body:
            '📦 <b>Modern warehouse</b>\n\n• 24/7 secured storage\n• Inventory and sorting\n• Consolidation & reloading',
        },
        repair: {
          title: '🛠 Wagon repair',
          body:
            '🛠 <b>Wagon repair</b>\n\n• Routine & capital repair\n• Certified workshops\n• Fast turnaround',
        },
        rent: {
          title: '🚄 Wagon rental',
          body:
            '🚄 <b>Wagon rental</b>\n\n• Platforms, gondolas, containers\n• Short and long term\n• Competitive rates',
        },
      },
    },
    calc: {
      start:
        '💰 <b>Price calculator</b>\n\nWhere does the cargo ship <b>from</b>?\n\n<i>Example:</i> China, Beijing',
      askDest: '✅ Noted.\n\nWhere should the cargo be delivered <b>to</b>?',
      askWeight:
        '⚖️ Please enter the approximate <b>weight</b> (tons):\n\n<i>Example:</i> 20',
      invalidWeight: '⚠️ Please enter a valid number (e.g. 500):',
      askPhone: (origin: string, dest: string, weight: string, est: number) =>
        `💡 <b>Preliminary estimate</b>\n\n📍 Route: ${origin} → ${dest}\n⚖️ Weight: ${weight} tons\n💵 <b>From $${est}</b>\n\n<i>Exact pricing will be confirmed by our manager over the phone.</i>\n\nShare your phone to submit the request 👇`,
      submitted:
        '✅ Request received!\n\nOur manager will reach out <b>within 1 hour</b>.',
      cancelled: 'Operation cancelled.',
    },
    contact: {
      body: (address: string, phone: string, hours: string) =>
        `📍 <b>Head office:</b>\n${address}\n\n📞 <b>Phone:</b>\n${phone}\n\n🕒 <b>Working hours:</b>\n${hours}`,
      callBtn: '📞 Call',
      mapBtn: '🗺 View on map',
      webBtn: '🌐 Website',
    },
    support: {
      prompt:
        '💬 <b>Support</b>\n\nDescribe your question or issue. Our team will reply shortly.',
      submitted: '✅ Message received! We\'ll be in touch soon.',
    },
    profile: {
      header: (name: string, phone: string, lang: string) =>
        `⚙️ <b>Profile</b>\n\n👤 Name: ${name}\n📱 Phone: ${phone}\n🌐 Language: ${lang}`,
      changeLang: '🌐 Change language',
      notRegistered: 'You\'re not registered yet. Tap /start.',
    },
    lang: {
      prompt: 'Choose a language:',
      changed: '✅ Language updated.',
    },
    fallback: '🤔 I didn\'t get that. Use the menu or /help.',
    help:
      '<b>📘 Help</b>\n\n/start — Restart the bot\n/track — Track a shipment\n/services — Services\n/calc — Price calculator\n/shipments — My shipments\n/support — Support\n/contact — Contacts\n/lang — Choose language',
  },
};

export interface ShipmentLike {
  trackingCode: string;
  senderName: string;
  receiverName: string;
  origin: string;
  destination: string;
  status: string;
  weight?: number | null;
  updatedAt: Date;
  events?: unknown;
}

function statusEmoji(status: string): string {
  switch (status) {
    case 'delivered':
      return '✅';
    case 'in_transit':
    case 'inTransit':
      return '🚚';
    case 'customs':
      return '🛃';
    case 'processing':
      return '📦';
    case 'pending':
    case 'new':
      return '🕒';
    default:
      return '📦';
  }
}

function formatEvents(events: unknown): Array<{ status: string; location?: string; date?: string }> {
  try {
    const arr = typeof events === 'string' ? JSON.parse(events) : events;
    if (!Array.isArray(arr)) return [];
    return arr.map((e: { status?: unknown; location?: string; date?: string }) => ({
      status:
        typeof e.status === 'string'
          ? e.status
          : (e.status as { uz?: string; ru?: string; en?: string } | null)?.uz ||
            (e.status as { uz?: string; ru?: string; en?: string } | null)?.en ||
            'Unknown',
      location: e.location,
      date: e.date,
    }));
  } catch {
    return [];
  }
}

function renderShipmentCardUz(s: ShipmentLike): string {
  const icon = statusEmoji(s.status);
  const events = formatEvents(s.events).slice(-3);
  const eventsStr = events.length
    ? `\n\n<b>So'nggi holatlar:</b>\n` +
      events.map((e) => `• <b>${e.status}</b>${e.location ? ` — ${e.location}` : ''}${e.date ? `\n  🕒 ${e.date}` : ''}`).join('\n')
    : '';
  return (
    `${icon} <b>${s.trackingCode}</b>\n\n` +
    `📍 <b>Qayerdan:</b> ${s.origin}\n` +
    `🏁 <b>Qayerga:</b> ${s.destination}\n` +
    (s.weight ? `⚖️ <b>Og'irlik:</b> ${s.weight} tonna\n` : '') +
    `📊 <b>Holat:</b> ${s.status.toUpperCase()}\n` +
    `📅 <i>Yangilangan: ${s.updatedAt.toISOString().slice(0, 16).replace('T', ' ')}</i>` +
    eventsStr
  );
}

function renderShipmentCardRu(s: ShipmentLike): string {
  const icon = statusEmoji(s.status);
  const events = formatEvents(s.events).slice(-3);
  const eventsStr = events.length
    ? `\n\n<b>Последние события:</b>\n` +
      events.map((e) => `• <b>${e.status}</b>${e.location ? ` — ${e.location}` : ''}${e.date ? `\n  🕒 ${e.date}` : ''}`).join('\n')
    : '';
  return (
    `${icon} <b>${s.trackingCode}</b>\n\n` +
    `📍 <b>Откуда:</b> ${s.origin}\n` +
    `🏁 <b>Куда:</b> ${s.destination}\n` +
    (s.weight ? `⚖️ <b>Вес:</b> ${s.weight} т\n` : '') +
    `📊 <b>Статус:</b> ${s.status.toUpperCase()}\n` +
    `📅 <i>Обновлено: ${s.updatedAt.toISOString().slice(0, 16).replace('T', ' ')}</i>` +
    eventsStr
  );
}

function renderShipmentCardEn(s: ShipmentLike): string {
  const icon = statusEmoji(s.status);
  const events = formatEvents(s.events).slice(-3);
  const eventsStr = events.length
    ? `\n\n<b>Latest events:</b>\n` +
      events.map((e) => `• <b>${e.status}</b>${e.location ? ` — ${e.location}` : ''}${e.date ? `\n  🕒 ${e.date}` : ''}`).join('\n')
    : '';
  return (
    `${icon} <b>${s.trackingCode}</b>\n\n` +
    `📍 <b>From:</b> ${s.origin}\n` +
    `🏁 <b>To:</b> ${s.destination}\n` +
    (s.weight ? `⚖️ <b>Weight:</b> ${s.weight} tons\n` : '') +
    `📊 <b>Status:</b> ${s.status.toUpperCase()}\n` +
    `📅 <i>Updated: ${s.updatedAt.toISOString().slice(0, 16).replace('T', ' ')}</i>` +
    eventsStr
  );
}

export function t(locale: BotLocale): BotMessages {
  return botMessages[locale] ?? botMessages.uz;
}

export function detectLocale(code: string | undefined | null): BotLocale {
  if (!code) return 'uz';
  const lc = code.toLowerCase();
  if (lc.startsWith('ru')) return 'ru';
  if (lc.startsWith('en')) return 'en';
  if (lc.startsWith('uz')) return 'uz';
  return 'uz';
}
