/**
 * Generate Uzbek (shartnoma.docx) and English (contract.docx) contract
 * templates that mirror the Russian договор.docx.
 *
 * Run once after editing translations:
 *   node scripts/generate-contract-templates.mjs
 *
 * Output files land in /templates next to the Russian original.
 * Placeholders ({d_number}, {company_name}, …) are preserved exactly so
 * docxtemplater substitutes identical fields across all three locales.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '..', 'templates');

// ─── Placeholders (kept identical across locales) ──────────────────────────
const P = {
  num: '{d_number}',
  date: '{date()}',
  name: '{company_name}',
  director: '{company_director}',
  address: '{companyAddress}',
  inn: '{company_inn}',
  bank: '{company_bank}',
  mfo: '{bank_mfo}',
  bankInn: '{bank_inn}',
  bankNum: '{bank_num}',
  corr: '{bank_corr}',
  corrAdr: '{bank_corr_adress}',
  corrSwift: '{bank_corr_swift}',
};

// ─── Shared style helpers ──────────────────────────────────────────────────
const FONT = 'Times New Roman';

function run(text, opts = {}) {
  return new TextRun({
    text: String(text ?? ''),
    font: FONT,
    size: opts.size ?? 24, // half-points → 12pt
    bold: !!opts.bold,
    italics: !!opts.italics,
    break: opts.break,
  });
}

function p(children, opts = {}) {
  return new Paragraph({
    alignment: opts.alignment ?? AlignmentType.JUSTIFIED,
    spacing: { after: opts.after ?? 120, line: 300 },
    indent: opts.indent,
    heading: opts.heading,
    children: Array.isArray(children) ? children : [children],
  });
}

function center(children, opts = {}) {
  return p(children, { ...opts, alignment: AlignmentType.CENTER });
}

function heading(text) {
  return center(run(text, { bold: true, size: 26 }), { after: 200 });
}

function clause(num, text) {
  return p([run(`${num} `, { bold: true }), run(text)]);
}

function subHeading(text) {
  return p(run(text, { bold: true }), { after: 120 });
}

// ─── Bank-details table (two columns, no borders) ──────────────────────────
function partyCell(lines) {
  return new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    borders: Object.fromEntries(
      ['top', 'bottom', 'left', 'right', 'insideHorizontal', 'insideVertical'].map((k) => [
        k,
        { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      ]),
    ),
    children: lines.map((line) =>
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 60 },
        children: Array.isArray(line) ? line : [line],
      }),
    ),
  });
}

function bankTable(expeditor, client) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: Object.fromEntries(
      ['top', 'bottom', 'left', 'right', 'insideHorizontal', 'insideVertical'].map((k) => [
        k,
        { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      ]),
    ),
    rows: [new TableRow({ children: [partyCell(expeditor), partyCell(client)] })],
  });
}

// ─── Locale content ────────────────────────────────────────────────────────
// Each locale exposes the exact same shape; only the wording differs.

const CONTENT = {
  uz: {
    fileName: 'shartnoma.docx',
    titleLine1: `SHARTNOMA № ${P.num}`,
    titleLine2:
      "harakatlanuvchi tarkibni taqdim etish bilan transport-ekspeditsiya xizmati koʻrsatish toʻgʻrisida",
    city: 'Toshkent sh.',
    parties: [
      run('«'),
      run('DAS PAY', { bold: true }),
      run('» MChJ, bundan buyon «'),
      run('Ekspeditor', { bold: true }),
      run(
        "» deb yuritiluvchi, Ustav asosida faoliyat yurituvchi direktor Saydakbarov K.S. shaxsida, bir tomondan, va ",
      ),
      run(P.name, { bold: true }),
      run(", bundan buyon «"),
      run('Mijoz', { bold: true }),
      run('» deb yuritiluvchi, Ustav asosida faoliyat yurituvchi direktor '),
      run(P.director, { bold: true }),
      run(
        " shaxsida, ikkinchi tomondan, keyinchalik birgalikda «Tomonlar», alohida esa «Tomon» deb atalib, harakatlanuvchi tarkibni taqdim etish bilan transport-ekspeditsiya xizmati koʻrsatish toʻgʻrisidagi ushbu Shartnomani (bundan keyin — Shartnoma) quyidagilar xususida tuzdilar:",
      ),
    ],
    sections: [
      {
        heading: 'MAZKUR SHARTNOMADA QOʻLLANILADIGAN ASOSIY TUSHUNCHALAR',
        body: [
          [
            run('Shartnoma ', { bold: true }),
            run(
              "— Ekspeditor va Mijoz oʻrtasidagi majburiyatning paydo boʻlishi, oʻzgarishi yoki bekor boʻlishiga asos boʻladigan, majburiyatning oʻrnatilishi, oʻzgartirilishi yoki bekor qilinishi haqidagi dalili mustahkamlangan hujjat, shu jumladan uning barcha ilovalari bilan birgalikda.",
            ),
          ],
          [
            run('Ekspeditor ', { bold: true }),
            run(
              '— yuk tashish ishlarini tashkil etish boʻyicha xizmat koʻrsatuvchi shaxs; transport ekspeditsiya shartnomasi asosida tashish hujjatlarida toʻlovchi sifatida koʻrsatilishi mumkin.',
            ),
          ],
          [
            run('Mijoz ', { bold: true }),
            run(
              '— ekspeditor bilan ekspeditsiya boʻyicha shartnoma tuzgan yoki unga ekspeditsiya topshiriqnomasini bergan va ekspeditor tomonidan qabul qilingan har qanday yuridik yoki jismoniy shaxs.',
            ),
          ],
          [
            run('Temir yoʻl stansiyasi ', { bold: true }),
            run(
              '— (qisq. — t/y stansiyasi) magistral yoʻllarni boʻlaklarga ajratuvchi, yoʻl rivoji mavjud, harakatni tartibga solish, oʻtkazish qobiliyatini taʼminlovchi punkt; poyezd va vagonlar bilan manevr va texnik amallarni bajarish imkonini beradi.',
            ),
          ],
          [
            run('Tashuvchi ', { bold: true }),
            run(
              '— tashish shartnomasi asosida yukni transport vositasida tashiydigan va tashish hujjatlarida tashuvchi sifatida koʻrsatilgan shaxs (tashishda ishtirok etuvchi davlatlarning temir yoʻl maʼmuriyatlari).',
            ),
          ],
          [
            run('Harakatlanuvchi tarkib ', { bold: true }),
            run(
              '— (qisq. — HT) ushbu shartnoma maqsadida yuk temir yoʻl vagonlari: yopiq vagon, yarim vagon, vagon-tsisterna, platforma, fiting platformasi, xopper, dumpkar va shunga oʻxshashlar.',
            ),
          ],
          [
            run('SMGS yuk xati ', { bold: true }),
            run(
              "— Xalqaro temir yoʻl yuk aloqasi toʻgʻrisidagi Bitimga aʼzo davlatlar oʻrtasidagi temir yoʻl tashishlarida qoʻllaniladigan yagona namunadagi tashish hujjati.",
            ),
          ],
          [
            run('Yuk ', { bold: true }),
            run(
              '— Mijoz tomonidan tashishga beriluvchi va temir yoʻl transporti orqali tashishga ruxsat etilgan tovar-moddiy boyliklar.',
            ),
          ],
          [
            run('Transport-ekspeditsiya xizmati ', { bold: true }),
            run(
              "— (qisq. — TEX) Ekspeditorning Mijoz arizasiga muvofiq yuk joʻnatuvchidan yuk oluvchigacha yukni yetkazib berishni tashkil etish faoliyati.",
            ),
          ],
          [
            run('Tashishga ariza ', { bold: true }),
            run(
              '— Mijoz tomonidan Ekspeditorga taqdim etiladigan maʼlumotlar majmuasi: rejalashtirilgan tashish davri, yoʻnalish stansiyalari, vagon miqdori va qiymati, toʻlovchi nomi va boshqa maʼlumotlar (Shartnomaning 1-Ilovasi shakliga muvofiq).',
            ),
          ],
          [
            run('Yuklash stansiyasi ', { bold: true }),
            run(
              '— Ekspeditor tomonidan tasdiqlangan temir yoʻl stansiyasi, unda Ekspeditor tomonidan yuborilgan vagonlarga yuk ortiladi va tashish hujjatlari rasmiylashtiriladi.',
            ),
          ],
          [
            run('Tushirish stansiyasi ', { bold: true }),
            run(
              '— Ekspeditor tomonidan tasdiqlangan temir yoʻl stansiyasi, unda vagondan yuk tushiriladi va boʻsh vagonni joʻnatish uchun zarur hujjatlar rasmiylashtiriladi.',
            ),
          ],
          [
            run('Yuk joʻnatuvchi ', { bold: true }),
            run(
              "— tashish shartnomasi tuzgan va tashish hujjatlarida yuk joʻnatuvchi sifatida koʻrsatilgan shaxs (Ekspeditor vakillari bundan mustasno). Yuk joʻnatuvchi toʻgʻrisidagi maʼlumot Mijoz tomonidan transport-ekspeditsiya xizmati arizasida taqdim etiladi.",
            ),
          ],
          [
            run('Yuk oluvchi ', { bold: true }),
            run(
              '— tashish hujjatlarida koʻrsatilgan, tashuvchidan yukni oluvchi shaxs (Ekspeditor vakillari bundan mustasno). Yuk oluvchi toʻgʻrisidagi maʼlumot Mijoz tomonidan transport-ekspeditsiya xizmati arizasida taqdim etiladi.',
            ),
          ],
          [
            run('Demeredj ', { bold: true }),
            run(
              '— temir yoʻl stansiyasida harakatlanuvchi tarkibning yuklash-tushirish operatsiyalari ostida kelishilgan muddatdan ortiq turib qolishi uchun toʻlov.',
            ),
          ],
          [
            run('Ekspeditor yoʻriqnomasi ', { bold: true }),
            run(
              '— Ekspeditorning Mijoz tomonidan bajarilishi majburiy koʻrsatmalarini oʻz ichiga olgan hujjat, shu jumladan tovar yuborish hujjatlarini toʻldirish, SMGS yuk xatini, tashish kodlarini va harakatlanuvchi tarkibning tegishliligini aniqlash boʻyicha.',
            ),
          ],
        ],
      },
      {
        heading: '1. SHARTNOMA PREDMETI',
        body: [
          clause(
            '1.1.',
            "Ushbu Shartnoma boʻyicha Mijoz topshiradi, Ekspeditor esa mukofot evaziga va Mijoz hisobidan yuklarni temir yoʻl transporti orqali tashish bilan bogʻliq transport-ekspeditsiya xizmatlarini (bundan keyin — Xizmatlar) hamda ichki, import, eksport va tranzit yuklarni koʻchirishni tashkil etish boʻyicha boshqa transport-ekspeditsiya xizmatlarini bajarish va/yoki bajarilishini tashkil etish majburiyatini oladi.",
          ),
          clause(
            '1.2.',
            "Tashish hajmi, muddatlari, yuk nomenklaturasi, harakatlanuvchi tarkibning turi va tegishliligi, yoʻnalish, tarif stavkalari, Ekspeditor mukofoti, qoʻshimcha xizmatlar va ularning qiymati hamda boshqa shartlar Mijoz tomonidan taqdim etilgan Ariza asosida, aniq yuk partiyasini tashishdan oldin Tomonlar tomonidan kelishiladi.",
          ),
          clause(
            '1.3.',
            "Tomonlar faoliyati yoʻnalish oʻtuvchi davlatlarning milliy transport qonunchiligi, Xalqaro temir yoʻl yuk aloqasi toʻgʻrisidagi Bitim (SMGS) va boshqa xalqaro temir yoʻl tashish qoidalari hamda ushbu Shartnoma shartlariga muvofiq tartibga solinadi.",
          ),
        ],
      },
      {
        heading: '2. TEX VA QOʻSHIMCHA XARAJATLAR UCHUN TOʻLOV',
        body: [
          clause(
            '2.1.',
            'Mijoz Ekspeditorning xizmatlar roʻyxati boʻyicha hisob-kitobga 100% (yuz foiz) oldindan toʻlovni hisobni rasmiylashtirgan kundan 3 (uch) ish kuni ichida amalga oshiradi. Toʻlovning boshqa tartibi Shartnomaga qoʻshimcha kelishuv bilan belgilanishi mumkin.',
          ),
          clause(
            '2.2.',
            "Toʻlov valyutasi va Shartnoma valyutasi — oʻzbek soʻmidir. Barcha toʻlov bilan bogʻliq bank xarajatlari toʻlovchi hisobidan qoplanadi. Tomonlar shartnoma summasi 1 000 000,00 (bir million) AQSH dollarini tashkil etishi mumkinligiga kelishdilar.",
          ),
          clause(
            '2.3.',
            'Ekspeditor har oyning keyingi oyidagi 10-kunigacha Mijozga elektron hisob-faktura va bajarilgan ishlar (koʻrsatilgan xizmatlar) dalolatnomasini taqdim etadi.',
          ),
          clause(
            '2.4.',
            "Mijoz qonunchilikda belgilangan muddatlarda ularni bandma-band koʻrib chiqishi va imzolashi shart. Elektron hisob-faktura va xizmatlar dalolatnomasidagi maʼlumotlar bilan rozi boʻlmagan holda, oʻzining asosli eʼtirozini belgilangan tartibda yuboradi.",
          ),
          clause(
            '2.5.',
            "Agar Mijozga yuborilgan xizmatlar dalolatnomasi va hisob-faktura 2.4-bandda koʻrsatilgan muddatda imzolanib Ekspeditorga yuborilmasa yoki Mijozdan asosli eʼtiroz kelib tushmasa, Tomonlar xizmatlar toʻla hajmda koʻrsatilgan va Mijoz tomonidan qabul qilingan deb tan oladilar. Haqiqatda koʻrsatilgan xizmatlar oldindan toʻlovdan oshib ketgan taqdirda, Mijoz Ekspeditor xizmatlarini hisob va dalolatnomalar asosida 5 (besh) ish kuni ichida toʻlash majburiyatini oladi.",
          ),
          clause(
            '2.6.',
            "Mijoz tomonidan kelishilgan xizmatlardan voz kechilgan taqdirda, Ekspeditor hujjat bilan tasdiqlangan barcha zararlari va/yoki xarajatlarini chegirib qolgan holda, pul mablagʻlarini qaytarish haqida yozma talab olingan kundan 15 (oʻn besh) ish kuni ichida Mijozga pul mablagʻlarini qaytaradi. Qaytarish uchun asos — yozma murojaat kuniga ikki tomonlama imzolangan solishtirish dalolatnomasi mavjudligidir.",
          ),
          clause(
            '2.7.',
            "Ekspeditorning Mijoz oldidagi qarz summasi, Mijoz Arizalariga keyingi davrdagi Ekspeditor xizmatlari toʻlovi hisobiga hisobga olinishi yoki Mijozning yozma arizasi boʻyicha imzolangan solishtirish dalolatnomasi olingan kundan 10 (oʻn) ish kuni ichida Mijozga qaytarilishi mumkin.",
          ),
          clause(
            '2.8.',
            "Ushbu Shartnoma muddatidan oldin bekor qilinganda, Mijoz 5 (besh) ish kuni ichida haqiqatda bajarilgan xizmatlarning tasdiqlangan hajmini toʻlaydi; agar oldindan toʻlov haqiqatda bajarilgan ishlar hajmidan oshsa, Ekspeditor Mijozning yozma talabi va imzolangan solishtirish dalolatnomasi asosida farqni 10 (oʻn) ish kuni ichida qaytaradi.",
          ),
          clause(
            '2.9.',
            "Arizani bajarish bilan bogʻliq, ammo Arizada ilgaridan koʻrsatilmagan qoʻshimcha xarajatlar Mijozdan elektron pochta yoki faks orqali oldindan soʻrov boʻlgandagina amalga oshirilishi mumkin va hisob rasmiylashtirilgan kundan 5 (besh) ish kuni ichida toʻlanadi.",
          ),
          clause(
            '2.10.',
            "Ekspeditorning markazlashtirilgan tashish toʻlovlari, yigʻimlari va boshqa kelishilgan xarajatlarning oʻzgarishi haqidagi xabarnomasi hamda qoʻshimcha xarajatlar yuzaga kelgan taqdirda Mijoz tomonidan 3 (uch) ish kuni ichida koʻrib chiqilishi va qabul qilingan qaror haqida Ekspeditorga maʼlumot berilishi lozim.",
          ),
          clause(
            '2.11.',
            "Agar 2.10-bandda koʻrsatilgan muddat ichida Ekspeditor Mijoz tomonidan qabul qilingan qaror haqida xabardor qilinmasa, Ekspeditor taklif qilgan oʻzgarishlar kuchga kiradi va oʻzaro hisob-kitoblarni amalga oshirishda majburiy hisoblanadi.",
          ),
          clause(
            '2.12.',
            "Harakatlanuvchi tarkibdan foydalanganlik uchun toʻlov hisobi, harakatlanuvchi tarkibning Mijozga topshirilgan kunidan boshlab Ekspeditorga qaytarilgan kunigacha amalga oshiriladi. Qabul-topshirish kunlari toʻlov hisobiga kiritiladi va Mijoz tomonidan toʻlanadi.",
          ),
          clause(
            '2.13.',
            "Toʻlov hisobi, harakatlanuvchi tarkibning rejali taʼmirlash davrida — Ekspeditor Yoʻriqnomasida koʻrsatilgan t/y stansiyasiga kelgan kunidan boshlab, taʼmirdan keyin kelishilgan t/y stansiyasiga qaytgan kunigacha toʻxtatiladi.",
          ),
          clause(
            '2.14.',
            "«Ekspeditor» va «Mijoz» oʻrtasidagi barcha oʻzaro hisob-kitoblar «Mijoz» tashishni amalga oshirgandan soʻng 90 kun ichida yakunlanishi lozim.",
          ),
          clause(
            '2.15.',
            "«Mijoz» (yuk tashish uchun toʻlovni birinchi marta amalga oshirayotgan) unga ajratilgan kodlardan foydalanmay, ularni «Ekspeditor»ga qaytargan taqdirda, «Ekspeditor» Mijozning yozma soʻrovini va ikki tomon imzolagan solishtirish dalolatnomasini olgan kundan 90 kalendar kun ichida pul mablagʻlarini qaytarish yoki oldindan toʻlov summasini kelajakdagi tashishlar hisobiga hisobga olish majburiyatini oladi.",
          ),
        ],
      },
      {
        heading: '3. TOMONLARNING HUQUQ VA MAJBURIYATLARI',
        body: [
          subHeading('3.1. Mijoz huquqli:'),
          clause('3.1.1.', 'Shartnomada belgilangan tartibda sifatli xizmatlar koʻrsatilishini Ekspeditordan talab qilish;'),
          clause('3.1.2.', "Arizani bajarish bilan bogʻliq hujjat bilan tasdiqlangan zararlar va xarajatlarni Ekspeditorga qoplash sharti bilan Arizani qaytarib olish;"),
          clause('3.1.3.', 'Ariza boʻyicha Ekspeditor xizmatlarining bajarilish jarayoni haqida ishonchli maʼlumot olish;'),
          clause('3.1.4.', 'Shartnomada belgilangan tartibda Shartnomani muddatidan oldin bekor qilish;'),
          clause('3.1.5.', "Ekspeditor roʻyxatdan oʻtgan joydagi amaldagi qonunchilik bilan nazarda tutilgan boshqa harakatlarni amalga oshirish."),

          subHeading('3.2. Mijoz majbur:'),
          clause('3.2.1.', "Ekspeditorga yukni transport-ekspeditsiya xizmati koʻrsatish uchun Arizani faks yoki e-mail orqali, barcha zarur rekvizitlar bilan, rejalashtirilgan tashishdan 5 (besh) kun oldin taqdim etish;"),
          clause('3.2.2.', "Mijoz tomonidan imzolangan va muhr bilan tasdiqlangan, faks yoki e-mail orqali yuborilgan Ariza asl nusxasiga tenglashtiriladi;"),
          clause('3.2.3.', "Faks yoki e-mail orqali yuborilgan talab kunidan 1 (bir) ish kuni ichida Ekspeditorga barcha zarur hujjatlar, yuk xususiyatlari va uni tashish xususiyatlari haqidagi maʼlumotlarni taqdim etish;"),
          clause('3.2.4.', 'Yukni tashishni tashkil etish bilan bogʻliq Ekspeditor yoʻriqnomalarini bajarish;'),
          clause('3.2.5.', "Temir yoʻl yuk xatini Yoʻriqnoma yoki Ekspeditor telegrammasi asosida, tashish kodlarining toʻgʻri koʻrsatilishi bilan toʻldirish;"),
          clause('3.2.6.', "Yuklash, tashish hujjatlarini rasmiylashtirish va tegishli transport turining amaldagi qoidalariga va Ekspeditor yoʻriqnomalariga muvofiq zarur belgilarni kiritishni taʼminlash;"),
          clause('3.2.7.', "SMGS 22-moddasiga muvofiq temir yoʻl yuk xatiga bojxona, sanitariya va eksport nazorati uchun zarur hamrohlik hujjatlarini ilova qilish;"),
          clause('3.2.8.', "Tashish hujjatlari yoki hamrohlik hujjatlaridagi kamchiliklar sababli chegara oʻtish stansiyalarida ushlab qolingan vagonlarni harakatga keltirish boʻyicha chora koʻrish;"),
          clause('3.2.9.', "Yuk joʻnatish maʼlumotlari kelib tushgan sari, lekin hisobot oyining 25-sanasidan kechiktirmay «Ekspeditor»ga t/y yuk xatlari nusxalarini (elektron pochta yoki boshqa usul orqali) taqdim etish;"),
          clause('3.2.10.', 'Yuklarni joʻnatish va harakatiga toʻsqinlik qiluvchi barcha holatlar haqida 1 (bir) ish kuni ichida Ekspeditorga xabar berish;'),
          clause('3.2.11.', "Yuk joʻnatuvchilar tomonidan tashish yoki hamrohlik hujjatlarining notoʻgʻri rasmiylashtirilganligi sababli temir yoʻllar tomonidan Ekspeditordan undirilgan barcha summalarni qoplash;"),
          clause('3.2.12.', "Mijoz aybidan Ekspeditor zimmasiga tushgan xarajatlarni hisob berilgan kundan 5 (besh) ish kuni ichida qoplash;"),
          clause('3.2.13.', "Vagonlar yoʻnalishini oʻzgartirmaslik; qayta yoʻnaltirish Ekspeditorning yozma roziligi va toʻlov amalga oshirilgandan soʻnggina mumkin;"),
          clause('3.2.14.', "Vagonlarni joʻnatish hujjatlarini rasmiylashtirishda SMGS yuk xatining 7-grafiga Ekspeditor yoʻriqnomalariga muvofiq vagonlar tegishliligi haqida yozuv kiritish;"),
          clause('3.2.15.', "Yuk joʻnatuvchi/yuk oluvchi yoki ularning vakillarini joʻnatish/manzil stansiyalarida boʻlishini taʼminlash; yoʻnalish oʻtuvchi davlatlar qonunchiligi talablariga rioya qilish uchun toʻliq javobgarlikni oʻz zimmasiga olish;"),
          clause('3.2.16.', "Ekspeditor soʻroviga muvofiq 10 (oʻn) ish kuni ichida tashish hujjatlari, ishonchnoma va umumiy shakldagi dalolatnomalar asl nusxasi yoki nusxasini taqdim etish."),

          subHeading('3.3. Ekspeditor huquqli:'),
          clause('3.3.1.', "Mijoz Arizasi boʻyicha oʻz majburiyatlarini bajarish uchun barcha zarur hujjatlar va toʻliq maʼlumotni talab qilish;"),
          clause('3.3.2.', 'Yuk xususiyatlari va uni tashish shartlari haqida toʻliq maʼlumot olish;'),
          clause('3.3.3.', "Mijoz zarur hujjat va maʼlumotlarni taqdim etmagan taqdirda Shartnoma (Ariza) boʻyicha majburiyatlarini bajarishga kirishmaslik;"),
          clause('3.3.4.', "Mijoz bilan yozma ravishda (faks yoki e-mail orqali ham) Arizada nazarda tutilmagan qoʻshimcha xarajatlarni kelishish;"),
          clause('3.3.5.', "Mijoz manfaati yoʻlida Shartnoma (Ariza) boʻyicha majburiyatlarni bajarish uchun uchinchi shaxslarni jalb qilish;"),
          clause('3.3.6.', "Mijozning qoʻshimcha xarajatlarga roziligi boʻlmasa yoki koʻrsatmalari xavfsizlik talablariga javob bermasa, Arizani bajarishdan bosh tortish;"),
          clause('3.3.7.', "Markazlashtirilgan t/y tariflari oʻzgarishi qabul qilingan taqdirda, Mijozni 2 (ikki) kun ichida xabardor qilgan holda TEX qiymatini bir tomonlama oʻzgartirish;"),
          clause('3.3.8.', "Shartnomaning 2-boʻlimiga koʻra toʻlov shartlari bajarilmagan boʻlsa, keyingi Ariza boʻyicha xizmat koʻrsatishdan bosh tortish;"),
          clause('3.3.9.', "Mijoz Shartnoma shartlarini bir necha marta buzgan taqdirda majburiyatlarini bajarishni toʻxtatish yoki Shartnomadan chiqish;"),
          clause('3.3.10.', 'Shartnomada belgilangan tartibda shartnoma munosabatlarini muddatidan oldin bekor qilish;'),
          clause('3.3.11.', "Qoʻshimcha toʻlov evaziga Mijozga vagonlar harakatini kuzatish xizmatini koʻrsatish (dam olish va bayram kunlari bundan mustasno)."),

          subHeading('3.4. Ekspeditor majbur:'),
          clause('3.4.1.', 'Ushbu Shartnomaning 1.1-bandida nazarda tutilgan xizmatlarni Mijozga koʻrsatish.'),
          clause('3.4.2.', "Yukni joʻnatishdan 24 soat oldin t/y tariflari toʻlov kodlarini oʻz ichiga olgan Yoʻriqnomani taqdim etish."),
          clause('3.4.3.', "Temir yoʻl tarifini toʻlash va bu tarif toʻlangandan soʻng 12 soat ichida Mijozni xabardor qilish."),
          clause('3.4.4.', 'Majburiyatlarini bajarish tartibi va muddatlaridagi oʻzgarishlar haqida Mijozni xabardor qilish;'),
          clause('3.4.5.', 'Alohida haq evaziga bojxona rasmiylashtiruvi va yuklarni sugʻurtalash xizmatlarini tashkil etish;'),
          clause('3.4.6.', "Arizani bajarish imkonsiz boʻlgan taqdirda, uni olgan kundan uch ish kuni ichida yozma rad javobini yuborish;"),
          clause('3.4.7.', "Vagondan yuk tushirilgandan soʻng boʻsh vagonni rasmiylashtirish boʻyicha yoʻriqnoma taqdim etish."),
          clause('3.4.8.', 'Tomonlar kelishuvi asosida Mijozning boshqa topshiriqlarini bajarish.'),
        ],
      },
      {
        heading: '4. HARAKATLANUVCHI TARKIBNI TAQDIM ETISH VA FOYDALANISH',
        body: [
          clause('4.1.', 'Ekspeditor Mijoz hisobidan va topshirigʻi boʻyicha, unga tegishli yoki uning masʼuliyatidagi harakatlanuvchi tarkibni vaqtinchalik foydalanishga tashkil etib beradi.'),
          clause('4.2.', 'Harakatlanuvchi tarkib turi, yuk turi, foydalanish muddati, topshirish va qaytarish tartibi, toʻlov va boshqa muhim shartlar Tomonlar tomonidan Arizada kelishiladi.'),
          clause('4.3.', 'Ekspeditor boʻsh, qoldiqlardan tozalangan, texnik soz va tijorat ekspluatatsiyasi uchun yaroqli harakatlanuvchi tarkibni Arizada kelishilgan t/y stansiyasiga yetkazib beradi.'),
          clause('4.4.', "Harakatlanuvchi tarkib kelishilgan t/y stansiyasiga kelgan kundan Mijoz tomonidan qabul qilingan hisoblanadi; kelish sanasi «Oʻzbekiston temir yoʻllari» AJ maʼlumotlari asosida aniqlanadi."),
          clause('4.5.', "Foydalanish muddati tugagach, Mijoz Ekspeditor yoʻriqnomasiga muvofiq boʻsh harakatlanuvchi tarkibni koʻrsatilgan stansiyaga yuboradi."),
          clause('4.6.', 'SMGS yuk xatining 7-grafini toʻldirishda Mijoz Ekspeditor yoʻriqnomasiga rioya qilishga majburdir.'),
          clause('4.7.', 'Mijoz harakatlanuvchi tarkibdan uning maqsadiga muvofiq va faqat kelishilgan yuk turini tashish uchun foydalanishga majbur. Boʻsh vagonlar qoldiqlardan tozalangan boʻlishi kerak.'),
          clause('4.8.', "Boʻsh vagonlarning yuklash stansiyasiga topshirilishi Ekspeditor tomonidan amalga oshiriladi."),
          clause('4.9.', "Tijorat yoki texnik nosozliklar aniqlangan taqdirda, Mijoz stansiya xodimlari bilan birga Texnik koʻrik dalolatnomasini rasmiylashtiradi va Ekspeditorga yoziladigan xabarga ilova qiladi. Ekspeditor 24 soat ichida keyingi harakatlar boʻyicha yozma yoʻriqnoma yuboradi."),
          clause('4.10.', "Mijoz vagon nosozligi harakat xavfsizligi va yuk saqlanishiga tahdid solmayotgan boʻlsa, uni qabul qilishdan bosh tortishga haqli emas."),
          clause('4.11.', "Mijoz boʻsh vagonlarni qaytarish boʻyicha Ekspeditor yozma yoʻriqnomalariga soʻzsiz rioya qilishga majbur."),
          clause('4.12.', "Mijoz harakatlanuvchi tarkibdan foydalanib boʻlgach, uni texnik soz holatda, qoldiqlardan tozalangan holda Ekspeditorga qaytarish majburiyatini oladi."),
        ],
      },
      {
        heading: '5. HARAKATLANUVCHI TARKIBNING TURIB QOLISHI',
        body: [
          clause('5.1.', "Yuklash/tushirish operatsiyalari uchun harakatlanuvchi tarkibning turib qolish muddati Tomonlar tomonidan kelishiladi."),
          clause('5.2.', 'Mijoz yuklash/tushirish va hujjatlarni rasmiylashtirish operatsiyalarini oʻz hisobidan bajarishga majbur.'),
          clause('5.3.', 'Turib qolish muddati harakatlanuvchi tarkib kelishilgan t/y stansiyasiga kelgan kundan boshlab, joʻnash kuniga qadar hisoblanadi; kelish va joʻnash kunlari turib qolish muddatiga kiritiladi.'),
          clause('5.4.', "Turib qolish muddati «Oʻzbekiston temir yoʻllari» AJ maʼlumotlari asosida aniqlanadi."),
          clause('5.5.', "Kelishilgan muddatdan ortiq turib qolish uchun Mijoz Ekspeditorga demeredj toʻlaydi; uning summasi alohida kelishiladi."),
          clause('5.6.', 'Mijoz aybidan harakatlanuvchi tarkibning turib qolishi Ekspeditor xarajatlarini keltirib chiqarsa, Mijoz ularni hisob asosida 3 (uch) ish kuni ichida toʻlaydi.'),
        ],
      },
      {
        heading: '6. HARAKATLANUVCHI TARKIBNI TAʼMIRLASH',
        body: [
          clause('6.1.', "Ekspeditor «Yuk vagonlari texnik xizmat koʻrsatish va taʼmirlash tizimi toʻgʻrisidagi Nizom»ga va ushbu Shartnomaga muvofiq Mijoz foydalanayotgan harakatlanuvchi tarkibning joriy va rejali taʼmirlashini tashkil etadi."),
          clause('6.2.', 'Ekspeditor rejali taʼmir boshlanishidan 30 (oʻttiz) kun oldin vagon raqamlari va taʼmir stansiyasini koʻrsatgan yoʻriqnoma yuboradi.'),
          clause('6.3.', 'Mijoz Ekspeditor roziligi bilan joriy taʼmirni oʻz hisobidan tashkil etishga haqli; Ekspeditor tasdiqlovchi hujjatlar asosida xarajatlarni qoplaydi.'),
          clause('6.4.', 'Mijoz aybi bilan Vagonlarga shikast yetkazilganda Ekspeditor Mijozdan taʼmir qiymati, tayyorgarlik, tashish va bojxona xarajatlarini talab qilishga haqli.'),
        ],
      },
      {
        heading: '7. SHARTNOMANING AMAL QILISH MUDDATI VA BEKOR QILISH TARTIBI',
        body: [
          clause('7.1.', 'Shartnoma imzolangan paytdan kuchga kiradi va 31.12.2026 kungacha amal qiladi. Hech bir Tomon Shartnomani tugatish haqida yozma xabardor qilmagan boʻlsa, muddat oʻsha shartlarda noaniq muddatga uzaytiriladi.'),
          clause('7.2.', 'Shartnoma har qanday Tomonning xohishi bilan bekor qilinishi mumkin. Tugatish haqida yozma xabarnoma boshqa Tomonga yuboriladi; sana koʻrsatilmagan boʻlsa, Shartnoma xabarnomani olgandan 20 (yigirma) kundan soʻng tugatilgan hisoblanadi.'),
          clause('7.3.', 'Shartnomaning muddatidan oldin bekor qilinishi Arizalar boʻyicha bajarilmay qolgan majburiyatlardan va Shartnoma shartlarini buzganlik uchun javobgarlikdan Tomonlarni ozod qilmaydi.'),
        ],
      },
      {
        heading: '8. TOMONLARNING JAVOBGARLIGI',
        body: [
          clause('8.1.', 'Majburiyatlarini bajarishga uchinchi shaxsni jalb qilgan Tomon, bu shaxsning harakatlari uchun oʻziniki kabi javobgardir.'),
          clause('8.2.', 'Ekspeditor tashish va hamrohlik hujjatlarining notoʻgʻri rasmiylashtirilishi hamda hukumat koʻrsatmasi bilan harakatni cheklovchi boshqa holatlar sababli yuzaga kelgan vagonlar kechikishi uchun javobgar emas.'),
          clause('8.3.', 'Ekspeditor bilan kelishilmagan yuk joʻnatish yoki ortiqcha hajmdagi ishlar uchun Mijoz Ekspeditor hisoblariga muvofiq toʻlaydi; Ekspeditor qiymatning ikki barobari miqdorida jarima qoʻllash huquqiga ega.'),
          clause('8.4.', "Mijoz harakatlaridan Ekspeditorga yetkazilgan zararlar uchun javobgar; Ekspeditor oʻz hisobidan jarima toʻlagan holatda summaning 3% foizi ham undiriladi."),
          clause('8.5.', 'Mijoz Ekspeditor tomonidan ajratilgan koddan foydalanish uchun javobgardir; kodlarni oʻzboshimchalik bilan ishlatganda u tashish qiymatining toʻliq tarifini toʻlaydi.'),
          clause('8.6.', 'Mijoz boshqa birovga tegishli vagonlarni oʻz tashishlari uchun ishlatishga haqli emas; bu talab buzilganda u vagonlar foydalanish haqi miqdorida jarima toʻlaydi.'),
          clause('8.7.', 'Mijoz yozma rozilik olmay vagonlar marshrutini oʻzgartirsa, Ekspeditor barcha xarajatlarini toʻlashga majbur.'),
          clause('8.8.', 'Mijoz aybi bilan vagonlar shikastlanganda yoki yoʻqolganda Mijoz ularni taʼmirlash yoki bozor qiymatini toʻlashga majbur.'),
          clause('8.9.', 'Vagon yuklash stansiyasiga berilgandan keyin 60 kun ichida qaytarilmasa, Mijoz aybi bilan yoʻqolgan hisoblanadi.'),
          clause('8.10.', "Shartnomada nazarda tutilgan toʻlovlarning oʻz vaqtida bajarilmaganligi uchun aybdor Tomon har bir kechikish kuni uchun qarz summasining 0,5% miqdorida, lekin koʻrsatilgan xizmatlar summasining 10% idan oshmagan miqdorda neustoyka toʻlaydi."),
          clause('8.11.', 'Ekspeditor Mijozning bojxona, soliq, sanitariya va boshqa davlat organlari talablarini bajarmasligidan kelib chiqqan zararlar uchun javobgar emas.'),
          clause('8.12.', 'Ekspeditor yuk kutilayotgandagi turib qolish, «oʻlik frakt», yetkazish sanalari va yukning saqlanishi uchun javobgar emas.'),
          clause('8.13.', 'Vagonlarning joʻnatish/manzil stansiyalaridagi turib qolishi uchun javobgarlik Mijoz zimmasiga tushadi.'),
          clause('8.14.', 'Mijoz tranzit deklaratsiyalari rasmiylashtirish maʼlumotlari toʻgʻriligi uchun toʻliq javobgardir.'),
          clause('8.15.', "Tomonlar Shartnoma Ekspeditor majburiyatlariga yuklarni qoʻriqlash va sugʻurta qilish kirmasligiga kelishdilar."),
          clause('8.16.', "Agar yoʻl-yoʻlakay vagon qayta yoʻnaltirilsa, Ekspeditor joʻnatish stansiyasidan qayta yoʻnaltirish stansiyasigacha va undan keyin koʻrsatilgan xizmatlar uchun hisoblarni qoʻyadi."),
        ],
      },
      {
        heading: '9. TALABLAR KIRITISH VA NIZOLARNI HAL ETISH TARTIBI',
        body: [
          clause('9.1.', 'Shartnoma bajarilmay qolganligi aniqlanganda, buni aniqlagan Tomon 2 (ikki) ish kuni ichida boshqa Tomonga yozma xabarnoma yuborishga majbur.'),
          clause('9.2.', 'Talabni olgan Tomon uni koʻrib chiqib, 30 (oʻttiz) ish kuni ichida asoslangan javob berishga majbur.'),
          clause('9.3.', "Shartnoma bilan bogʻliq barcha nizolarni Tomonlar muzokara yoʻli bilan hal etadilar."),
          clause('9.4.', 'Muzokaralar natijasiz qolsa, manfaatdor Tomon Ekspeditor roʻyxatdan oʻtgan joydagi vakolatli sudga murojaat qiladi.'),
        ],
      },
      {
        heading: '10. FORS-MAJOR',
        body: [
          clause('10.1.', "Tomonlar ushbu Shartnoma boʻyicha majburiyatlarning qisman yoki toʻliq bajarilmaganligi yengib boʻlmas kuch (urush, davlat organlarining taqiqlovchi choralari, qonunchilik oʻzgarishi, zilzila, yongʻin, suv bosishi va boshqa) oqibati boʻlsa, javobgarlikdan ozod qilinadi."),
          clause('10.2.', 'Fors-major holatlar yuz berganda, majburiyatlar bajarilishi muddati ular davom etgan muddatga uzaytiriladi.'),
          clause('10.3.', 'Majburiyatini bajara olmayotgan Tomon 3 (uch) ish kuni ichida buni yozma shaklda boshqa Tomonga xabar qilishi shart.'),
          clause('10.4.', "Tomonlar temir yoʻllar Maʼmuriyatining konventsiya taqiqlovlarini fors-major holat deb tan oladilar."),
          clause('10.5.', "Yengib boʻlmas kuch mavjudligining isboti vakolatli organ tomonidan beriladigan maʼlumotnomalar boʻladi."),
          clause('10.6.', 'Fors-major tugaganidan keyin 3 (uch) ish kuni ichida tegishli Tomon buni xabar qiladi va majburiyatlarni qaytadan bajara boshlaydi. Fors-major bir oydan ortiq davom etsa, har qanday Tomon Shartnomani bekor qilishi mumkin.'),
        ],
      },
      {
        heading: '11. YAKUNIY QOIDALAR',
        body: [
          clause('11.1.', "Hech bir Tomon boshqa Tomonning yozma roziligisiz huquq va majburiyatlarni uchinchi shaxsga oʻtkazishga haqli emas."),
          clause('11.2.', 'Har bir Tomon Shartnoma bilan bogʻliq maxfiy maʼlumotni himoya qiladi va uni faqat Shartnoma majburiyatlarini bajarish uchun ishlatadi.'),
          clause('11.3.', 'Tomonlardan biri qayta tashkil etilsa yoki tugatilsa, huquq va majburiyatlar huquqiy merosxoʻrga oʻtadi. Rekvizitlar oʻzgargan taqdirda Tomonlar darhol bir-birini xabardor qiladilar.'),
          clause('11.4.', "Ushbu Shartnoma shartlariga oʻzgartirish va qoʻshimchalar faqat Tomonlarning oʻzaro yozma kelishuvi bilan amalga oshiriladi."),
          clause('11.5.', "Tomonlar faks yoki e-mail orqali yuborilgan hujjatlar asl nusxaga teng yuridik kuchga ega ekanligiga kelishdilar."),
          clause('11.6.', "Faks yoki e-mail orqali yuborilgan, imzo va muhr bilan tasdiqlangan Shartnoma va Qoʻshimcha kelishuvlar asl nusxaga tenglashtiriladi."),
          clause('11.7.', "Shartnomaning biron bir sharti oʻz kuchini yoʻqotsa, bu boshqa shartlarning amal qilishiga taʼsir qilmaydi."),
          clause('11.8.', "Shartnomada oʻz ifodasini topmagan qismda Oʻzbekiston Respublikasining amaldagi qonunchiligi qoʻllaniladi."),
          clause('11.9.', "Ushbu Shartnoma oʻzbek tilida teng yuridik kuchga ega ikki nusxada tuzilgan, har bir Tomon uchun bittadan."),
        ],
      },
    ],
    bankBlockHeading: '12. TOMONLAR MANZILI VA BANK REKVIZITLARI',
    expeditorLabel: '«EKSPEDITOR»',
    clientLabel: '«MIJOZ»',
    legalAddressLabel: 'Yuridik va haqiqiy manzil:',
    expeditorAddress: "Oʻzbekiston Respublikasi, Toshkent sh., Yashnobod t., Botkina koʻch. 6/33",
    innLabel: 'STIR:',
    expeditorInn: '311 278 526',
    bankDetailsLabel: 'Bank rekvizitlari:',
    expeditorBank: "«Kapital Bank» AITB, Toshkent sh.",
    expeditorMfo: 'MFO 01158',
    expeditorBankInn: 'Bank STIRi: 207 275 139',
    expeditorAccount: "H/r: 20208 000 6 07053373 001 (UZS)",
    corrBankLabel: 'Korrespondent bank:',
    corrBankName: 'THE BANK OF NEW YORK MELLON',
    corrBankAddress: 'US-NY10286',
    corrBankSwift: 'SWIFT: IRVTUS3N',
    directorLabel: 'Direktor',
    expeditorDirector: 'Saydakbarov K.S. _________________________',
  },
  en: {
    fileName: 'contract.docx',
    titleLine1: `CONTRACT No. ${P.num}`,
    titleLine2:
      'for freight-forwarding services with provision of rolling stock',
    city: 'Tashkent city',
    parties: [
      run('"'),
      run('DAS PAY', { bold: true }),
      run('" LLC, hereinafter referred to as the "'),
      run('Forwarder', { bold: true }),
      run(
        '", acting through its Director Saydakbarov K.S. on the basis of the Charter, on the one hand, and ',
      ),
      run(P.name, { bold: true }),
      run(', hereinafter referred to as the "'),
      run('Client', { bold: true }),
      run('", acting through its Director '),
      run(P.director, { bold: true }),
      run(
        ' on the basis of the Charter, on the other hand, jointly referred to as the "Parties" and each individually as a "Party", have concluded this Contract for freight-forwarding services with provision of rolling stock (hereinafter — the Contract) as follows:',
      ),
    ],
    sections: [
      {
        heading: 'KEY DEFINITIONS USED IN THIS CONTRACT',
        body: [
          [run('Contract ', { bold: true }), run('— the agreement between the Forwarder and the Client that gives rise to, amends or terminates an obligation, together with all its annexes.')],
          [run('Forwarder ', { bold: true }), run('— the party providing services for the organisation of cargo transportation, which may be indicated in transport documents as the payer under a freight-forwarding contract.')],
          [run('Client ', { bold: true }), run('— any legal entity or individual that has concluded a forwarding contract with the Forwarder or has issued and had accepted a forwarding order, and that bears the corresponding rights and obligations.')],
          [run('Railway station ', { bold: true }), run('— (abbr. — railway station) a point dividing the main lines into sections, with a track layout allowing operations for reception, dispatch, passing and shunting of trains, as well as cargo and luggage handling.')],
          [run('Carrier ', { bold: true }), run('— the entity performing carriage of goods by means of transport under a carriage contract, designated as the carrier in transport documents (railway administrations of the participating states).')],
          [run('Rolling stock ', { bold: true }), run('— (abbr. — RS) for the purposes of this Contract: freight railway wagons, including but not limited to boxcars, gondolas, tank wagons, flatcars, fitting platforms, hoppers, and dump cars.')],
          [run('SMGS consignment note ', { bold: true }), run('— a unified transport document used in rail freight traffic between states party to the Agreement on International Railway Freight Traffic and between them and other states.')],
          [run('Cargo ', { bold: true }), run('— the goods declared by the Client for transportation and permitted for carriage by rail.')],
          [run('Freight forwarding ', { bold: true }), run('— (abbr. — FF) the activity of the Forwarder aimed at organising delivery of cargo from consignor to consignee in accordance with the Client Request.')],
          [run('Transportation request ', { bold: true }), run('— the data provided by the Client to the Forwarder, including planned transportation period, origin/destination stations and railways, quantity and cost of wagons, payer, validity period and other data (per the form in Annex No. 1).')],
          [run('Loading station ', { bold: true }), run('— the railway station confirmed by the Forwarder where loading of the wagons and drawing up of transport documents take place.')],
          [run('Unloading station ', { bold: true }), run('— the railway station confirmed by the Forwarder where cargo is unloaded and documents for dispatch of the empty wagon are drawn up.')],
          [run('Consignor ', { bold: true }), run('— the party that has concluded the contract of carriage and is listed in the transport documents as the sender of the cargo, excluding the Forwarder\u2019s representatives.')],
          [run('Consignee ', { bold: true }), run('— the party receiving cargo from the carrier and listed in the transport documents, excluding the Forwarder\u2019s representatives.')],
          [run('Demurrage ', { bold: true }), run('— the charge for detention of rolling stock at a railway station under loading/unloading operations beyond the agreed period.')],
          [run('Forwarder\u2019s instructions ', { bold: true }), run('— the document containing the Forwarder\u2019s mandatory instructions to the Client on completion of shipping documents, including SMGS consignment notes, freight codes and attribution of rolling stock.')],
        ],
      },
      {
        heading: '1. SUBJECT OF THE CONTRACT',
        body: [
          clause('1.1.', 'Under this Contract the Client instructs, and the Forwarder undertakes, for a fee and at the Client\u2019s expense, to perform and/or arrange the performance of freight-forwarding services (hereinafter — the Services) related to transportation of cargo by rail, as well as other freight-forwarding services for organisation of domestic, import, export and transit cargo movements.'),
          clause('1.2.', 'The volumes of transportation, deadlines, cargo range, type and ownership of rolling stock, route, tariff rates, Forwarder\u2019s remuneration, additional services and their cost, as well as other terms, shall be agreed by the Parties immediately before the performance of each specific shipment on the basis of a Request submitted by the Client.'),
          clause('1.3.', 'Activities of the Parties shall be governed by the national transport laws of the states through whose territory the route passes, international Rules of rail transportation, including the Agreement on International Railway Freight Traffic (SMGS), and the terms of this Contract.'),
        ],
      },
      {
        heading: '2. PAYMENT FOR FREIGHT FORWARDING AND ADDITIONAL COSTS',
        body: [
          clause('2.1.', 'The Client shall make 100% (one hundred per cent) prepayment for the declared list of Services based on the invoice within 3 (three) business days from the date of invoicing. Another payment procedure may be stipulated by a supplementary agreement.'),
          clause('2.2.', 'The currency of payment and the Contract is the Uzbek sum. All bank charges related to payments are paid by the payer. The Parties agreed that the total amount under the Contract may reach USD 1,000,000.00 (one million US dollars).'),
          clause('2.3.', 'Each month, no later than the 10th day of the month following the reporting month, the Forwarder provides the Client with an electronic invoice and an Act of performed works (services rendered).'),
          clause('2.4.', 'The Client shall review item-by-item and sign the documents within the period stipulated by law. In case of disagreement, a reasoned objection shall be sent in the established manner.'),
          clause('2.5.', 'If the acts and invoices sent to the Client are not signed and returned to the Forwarder within the period stated in clause 2.4, and no reasoned objection is received, the Parties recognise that the Services were rendered in full and accepted by the Client. Where the value of services actually rendered exceeds the prepayment, the Client shall pay the Forwarder within 5 (five) business days based on invoices and acts.'),
          clause('2.6.', 'If the Client cancels agreed services, the Forwarder, less all documented losses and/or costs associated with executing the Request, returns the funds to the Client within 15 (fifteen) business days from receipt of the written refund demand. The basis for refund is a bilaterally signed reconciliation act.'),
          clause('2.7.', 'Any debt of the Forwarder to the Client may be offset against future Forwarder services for the Client\u2019s Requests or returned by written request within 10 (ten) business days after receipt of the signed reconciliation act.'),
          clause('2.8.', 'Upon early termination of this Contract, the Client shall pay for the confirmed volume of services actually rendered within 5 (five) business days; if the prepayment exceeds the volume of work actually performed, the Forwarder returns the difference within 10 (ten) business days.'),
          clause('2.9.', 'Additional Forwarder costs related to executing the Request but not previously specified may be incurred only upon the Client\u2019s prior request sent via email or fax, and shall be paid within 5 (five) business days from the invoice date.'),
          clause('2.10.', 'Any Forwarder notice of changes in centralised transportation charges, fees and other agreed expenses, as well as of additional costs, shall be reviewed by the Client within 3 (three) business days with notification of the decision to the Forwarder.'),
          clause('2.11.', 'If within the period stated in clause 2.10 the Forwarder is not notified of the Client\u2019s decision, the Forwarder\u2019s proposed changes take effect and are binding for settlements.'),
          clause('2.12.', 'Charges for use of rolling stock accrue from the date of its transfer to the Client to the date of its return to the Forwarder. Dates of transfer/return are included in the calculation and paid by the Client.'),
          clause('2.13.', 'Charges are suspended during scheduled maintenance of rolling stock, from arrival at the station indicated in the Forwarder\u2019s Instruction until return to the agreed station after repair.'),
          clause('2.14.', 'All settlements between the "Forwarder" and the "Client" shall be completed within 90 days after the "Client" has performed the transportation.'),
          clause('2.15.', 'If the "Client" (making a first-time payment for cargo transportation) does not use the allocated codes and returns them to the "Forwarder", the latter shall refund the funds upon written request within 90 calendar days from receipt of the request and signing of a reconciliation act, or the prepayment may be offset against future shipments.'),
        ],
      },
      {
        heading: '3. RIGHTS AND OBLIGATIONS OF THE PARTIES',
        body: [
          subHeading('3.1. The Client is entitled to:'),
          clause('3.1.1.', 'demand Services of appropriate quality from the Forwarder in the manner and under the conditions set by the Contract;'),
          clause('3.1.2.', 'revoke a Request with mandatory compensation to the Forwarder for documented losses and costs;'),
          clause('3.1.3.', 'receive reliable information on the progress of the Request;'),
          clause('3.1.4.', 'terminate the Contract early in accordance with the procedure stipulated in the Contract;'),
          clause('3.1.5.', 'perform other actions provided for by the applicable legislation at the Forwarder\u2019s place of registration.'),

          subHeading('3.2. The Client shall:'),
          clause('3.2.1.', 'provide the Forwarder with the Request for freight-forwarding by fax or email, with all required cargo details, 5 (five) days prior to the scheduled transportation;'),
          clause('3.2.2.', 'a Request signed and stamped by the Client and sent by fax or email is deemed equivalent to the original;'),
          clause('3.2.3.', 'within 1 (one) business day of a fax or email request submit to the Forwarder all required documents and information about the cargo, its transportation and any other data necessary for performance of the Request;'),
          clause('3.2.4.', 'follow the Forwarder\u2019s instructions related to organising the carriage;'),
          clause('3.2.5.', 'complete the railway consignment note in accordance with the Instruction or the Forwarder\u2019s telegram, correctly indicating the transportation codes;'),
          clause('3.2.6.', 'ensure loading, preparation of transport documents and inclusion of necessary notes in accordance with the rules of the relevant mode of transport and the Forwarder\u2019s instructions;'),
          clause('3.2.7.', 'prepare and attach to the railway consignment note, in accordance with Article 22 of the SMGS, accompanying documents required for customs, sanitary, quarantine procedures and export control;'),
          clause('3.2.8.', 'take measures to move wagons detained at border crossing stations due to defects in documents;'),
          clause('3.2.9.', 'as shipping information is received, but no later than the 25th day of the reporting month, provide the "Forwarder" with copies of rail consignment notes (by email or any available means);'),
          clause('3.2.10.', 'within 1 (one) business day inform the Forwarder of any circumstances preventing shipment or movement of cargo;'),
          clause('3.2.11.', 'reimburse the Forwarder for all amounts recovered from the latter by railways due to wagon detention caused by improper preparation of transportation or accompanying documents by the consignor;'),
          clause('3.2.12.', 'reimburse documented Forwarder costs within 5 (five) business days from the invoice date, resulting from errors by the Client in preparing shipping documents, customs declarations, import/export and transit permits, or from wagon detention caused by the Client, penalties for over-normative rolling-stock idle time, inability to transfer cargo to sea transport or foreign railways due to the Client\u2019s breach of regulations, misuse of codes and sub-codes issued by the Forwarder, and absence of required accompanying documents;'),
          clause('3.2.13.', 'not change wagon routes; re-routing is allowed only with the Forwarder\u2019s written consent and after full payment for the additional service;'),
          clause('3.2.14.', 'when preparing dispatch documents, enter records into field 7 of the SMGS consignment note strictly in accordance with the Forwarder\u2019s instructions;'),
          clause('3.2.15.', 'ensure the presence of the consignor/consignee or their authorised representatives at origin/destination stations and bear full responsibility for compliance with the laws of the transit states, including tax, customs and currency laws, as well as railway administration requirements and international transport law;'),
          clause('3.2.16.', 'upon Forwarder request, within 10 (ten) business days provide originals and/or copies of transport documents, powers of attorney, general-form acts and other documents needed to resolve disputes with third parties.'),

          subHeading('3.3. The Forwarder is entitled to:'),
          clause('3.3.1.', 'request from the Client all documents and information necessary to fulfil its obligations;'),
          clause('3.3.2.', 'receive full information about cargo properties and transportation conditions;'),
          clause('3.3.3.', 'not commence performance of obligations under the Contract (Request) if the Client fails to provide required documents or information;'),
          clause('3.3.4.', 'agree in writing with the Client (including by fax or email) any additional costs not covered by the Request;'),
          clause('3.3.5.', 'engage third parties to perform obligations under the Contract (Request) while acting in the Client\u2019s interests;'),
          clause('3.3.6.', 'refuse execution of a Request if the Client refuses to pay additional costs or if the Client\u2019s instruction does not meet safety requirements;'),
          clause('3.3.7.', 'unilaterally change the cost of freight-forwarding services in case of centralised changes to rail tariffs, fees and charges, with mandatory notice to the Client within 2 (two) days;'),
          clause('3.3.8.', 'refuse to provide services on the next Request if the Client has not met the payment terms in Section 2 of the Contract;'),
          clause('3.3.9.', 'suspend performance of obligations or withdraw from further performance of the Contract if the Client repeatedly breaches its terms;'),
          clause('3.3.10.', 'terminate the Contract early in the manner stipulated in the Contract;'),
          clause('3.3.11.', 'for additional payment, provide tracking of the Client\u2019s wagons from the origin station (excluding weekends and public holidays).'),

          subHeading('3.4. The Forwarder shall:'),
          clause('3.4.1.', 'provide the Client with the services described in clause 1.1 of this Contract;'),
          clause('3.4.2.', 'no later than 24 hours before dispatch, provide an Instruction on completion of rail consignment notes, including payment codes for rail tariffs and additional charges, and names of border crossing stations;'),
          clause('3.4.3.', 'pay the railway tariff and inform the Client within 12 hours of payment and procedure for completing transport documents;'),
          clause('3.4.4.', 'inform the Client of any changes in the procedure or timing of performance;'),
          clause('3.4.5.', 'for an additional fee, arrange customs clearance and cargo insurance and provide rolling stock for use;'),
          clause('3.4.6.', 'if a Request cannot be executed, send a written refusal within three business days from receipt;'),
          clause('3.4.7.', 'after cargo is unloaded from the wagon, provide an instruction on handling the empty wagon;'),
          clause('3.4.8.', 'by agreement of the Parties, carry out other Client instructions with cost reimbursement as stipulated in the Contract.'),
        ],
      },
      {
        heading: '4. PROVISION AND USE OF ROLLING STOCK',
        body: [
          clause('4.1.', 'The Forwarder, at the Client\u2019s expense and on its instructions, arranges temporary use of rolling stock owned by or under the Forwarder\u2019s responsibility.'),
          clause('4.2.', 'Type of rolling stock, type of cargo, term of use, transfer and return procedure, payment and other essential terms are agreed and specified in the Request.'),
          clause('4.3.', 'The Forwarder arranges delivery of empty, cleaned, technically sound rolling stock suitable for commercial operation to the station agreed in the Request.'),
          clause('4.4.', 'Rolling stock is deemed handed over by the Forwarder and accepted by the Client from the date of arrival at the agreed station, as determined by data of "Uzbekistan Railways" JSC.'),
          clause('4.5.', 'At the end of the usage period, the Client sends the empty rolling stock to the station indicated in the Forwarder\u2019s instruction.'),
          clause('4.6.', 'When completing field 7 of the SMGS consignment note for cargo carried in rolling stock owned by the Forwarder, the Client shall follow the Forwarder\u2019s instructions.'),
          clause('4.7.', 'The Client shall use rolling stock strictly for its intended purpose and only to carry the agreed type of cargo. Empty wagons must be cleaned from residues of previously carried cargo and packaging.'),
          clause('4.8.', 'Dispatch of empty wagons to the loading station is carried out by the Forwarder. Wagons are deemed provided to the Client from the date of arrival at the loading station.'),
          clause('4.9.', 'Upon detection of commercial or technical defects, the Client, together with station staff, draws up a Technical Inspection Act and attaches it to a written notice to the Forwarder. The Forwarder issues written instructions within 24 hours of receiving the notice.'),
          clause('4.10.', 'The Client may not refuse acceptance of a wagon whose defect does not endanger movement safety, personnel or cargo, as confirmed by the competent authority.'),
          clause('4.11.', 'The Client shall strictly follow the Forwarder\u2019s written instructions for completing consignment notes for the return of empty wagons.'),
          clause('4.12.', 'After use, the Client shall return rolling stock to the Forwarder cleaned, technically sound and fit for operation.'),
        ],
      },
      {
        heading: '5. IDLE TIME OF ROLLING STOCK',
        body: [
          clause('5.1.', 'The Parties agree on the period of idle time of rolling stock under loading/unloading operations.'),
          clause('5.2.', 'The Client shall perform all loading/unloading operations and documentation at its own expense.'),
          clause('5.3.', 'The calculation of idle time starts from arrival of rolling stock at the agreed station and ends with departure; dates of arrival and departure are both counted.'),
          clause('5.4.', 'Idle time is determined based on data of "Uzbekistan Railways" JSC, or — when copies of SMGS notes are provided — by calendar-stamp dates of station arrival/departure.'),
          clause('5.5.', 'For breach of the agreed idle time the Client pays the Forwarder demurrage, separately agreed, along with other costs incurred.'),
          clause('5.6.', 'If idle time is caused by the Client\u2019s fault and triggers additional Forwarder costs, the Client pays the actual costs based on supporting documents within 3 (three) business days.'),
        ],
      },
      {
        heading: '6. REPAIR OF ROLLING STOCK',
        body: [
          clause('6.1.', 'The Forwarder organises current and scheduled repairs of rolling stock in the Client\u2019s use in accordance with the Regulation on Maintenance and Repair of Freight Wagons and this Contract.'),
          clause('6.2.', 'The Forwarder, 30 (thirty) calendar days before the scheduled repair, sends the Client an instruction indicating the wagon numbers, repair date and station of acceptance/transfer.'),
          clause('6.3.', 'The Client may, with the Forwarder\u2019s consent, organise current repairs at its own expense; the Forwarder reimburses these costs upon provision of supporting documents.'),
          clause('6.4.', 'In case of damage to Wagons, their units and parts due to the Client\u2019s actions/inaction, the Forwarder may demand reimbursement of repair costs, transportation, and all related customs and other expenses.'),
        ],
      },
      {
        heading: '7. CONTRACT DURATION AND TERMINATION',
        body: [
          clause('7.1.', 'The Contract enters into force upon signing and remains valid through 31.12.2026. It may be extended by mutual agreement if no Party notifies the other of termination in writing before expiry; settlements continue until full performance.'),
          clause('7.2.', 'The Contract may be terminated by either Party by written notice; if the date is not specified, termination occurs 20 (twenty) days after receipt of the notice. Settlements must be completed within 30 days after termination.'),
          clause('7.3.', 'Early termination does not relieve the Parties of unfulfilled obligations under Requests or liability for breaches.'),
        ],
      },
      {
        heading: '8. LIABILITY OF THE PARTIES',
        body: [
          clause('8.1.', 'A Party engaging a third party is liable for the latter\u2019s actions as for its own.'),
          clause('8.2.', 'The Forwarder is not liable for wagon delays and returns to the consignor caused by improper documents or other circumstances limiting movement by order of the relevant state.'),
          clause('8.3.', 'Shipment without the Forwarder\u2019s agreement or works exceeding the agreed volumes shall be paid by the Client per Forwarder invoices; the Forwarder may apply penalties at double the current rate.'),
          clause('8.4.', 'The Client is liable for losses caused to the Forwarder, including the penalty amount plus 3% for use of the Forwarder\u2019s funds if the Forwarder paid such penalty at its own expense.'),
          clause('8.5.', 'The Client is liable for use of the code issued by the Forwarder confirming payment for the declared volume; unauthorised use results in the Client paying the full tariff.'),
          clause('8.6.', 'The Client (consignor/consignee) and other persons may not use wagons or containers that do not belong to them without written permission; breach results in a penalty equal to the usage fee.'),
          clause('8.7.', 'Unauthorised change of wagon route by the Client entails full reimbursement of resulting Forwarder expenses or losses.'),
          clause('8.8.', 'In case of damage or loss of wagons during loading/unloading and operation through the Client\u2019s fault, the Client shall repair them or compensate the repair cost, as well as pay the market value in case of loss.'),
          clause('8.9.', 'A wagon is deemed lost through the Client\u2019s fault if not returned to the Forwarder within sixty days from dispatch to the loading station.'),
          clause('8.10.', 'For late payment under the Contract the defaulting Party pays a penalty of 0.5% of the outstanding amount per day, but not more than 10% of the cost of services rendered.'),
          clause('8.11.', 'The Forwarder is not liable for losses caused by the Client\u2019s (or its consignor/consignee\u2019s) failure to comply with customs, tax, sanitary and other authorities\u2019 requirements in the transit states.'),
          clause('8.12.', 'The Forwarder is not liable for idle time awaiting cargo, "dead freight", departure/delivery dates, cargo safety during carriage, natural loss, or improper shipping documents and SMGS notes.'),
          clause('8.13.', 'Liability for idle time at origin/destination/border stations, penalties from the Railway Administration and other unforeseen costs caused by the Client\u2019s actions rests with the Client.'),
          clause('8.14.', 'The Client bears full liability for data provided to the Forwarder for transit declarations at border crossings; the Forwarder is not liable for the accuracy of such data.'),
          clause('8.15.', 'The Parties agreed that guarding and insuring the Client\u2019s cargo are not part of the Forwarder\u2019s obligations under this Contract.'),
          clause('8.16.', 'If a wagon is re-routed en route, the Forwarder issues invoices for the service from the origin to the re-routing station and from the re-routing station to the new destination.'),
        ],
      },
      {
        heading: '9. CLAIMS AND DISPUTE RESOLUTION',
        body: [
          clause('9.1.', 'Upon discovery of non-performance of the Contract, the Party detecting this shall send a written notice to the other Party within 2 (two) business days.'),
          clause('9.2.', 'The Party receiving a claim shall review it and provide a reasoned response within 30 (thirty) business days.'),
          clause('9.3.', 'All disputes are resolved by negotiation and settled by additional written agreements.'),
          clause('9.4.', 'If negotiation fails, the interested Party applies to the competent court at the Forwarder\u2019s place of registration in accordance with the applicable law.'),
        ],
      },
      {
        heading: '10. FORCE MAJEURE',
        body: [
          clause('10.1.', 'The Parties are released from liability for partial or full non-performance caused by force majeure: military actions, prohibitions by state authorities, changes in law, strikes, earthquakes, fires, floods and other uncontrollable events.'),
          clause('10.2.', 'When force majeure occurs, the performance deadline is extended proportionally.'),
          clause('10.3.', 'The affected Party shall notify the other Party in writing within 3 (three) business days of the force-majeure event.'),
          clause('10.4.', 'The Parties recognise as force majeure convention-based prohibitions of Railway Administrations on acceptance of loaded or empty wagons.'),
          clause('10.5.', 'Proper evidence of force-majeure circumstances shall be certificates from the competent authority.'),
          clause('10.6.', 'Within three business days of the end of force majeure, the affected Party notifies the other and resumes performance. If force majeure lasts more than one month, either Party may terminate the Contract with at least 14 days\u2019 written notice.'),
        ],
      },
      {
        heading: '11. FINAL PROVISIONS',
        body: [
          clause('11.1.', 'Neither Party may assign rights and obligations under the Contract without the other\u2019s written consent.'),
          clause('11.2.', 'Each Party treats all information related to the Contract as confidential and uses it only to fulfil its obligations.'),
          clause('11.3.', 'Upon reorganisation or liquidation of a Party, all rights and obligations pass to its legal successor; the Parties promptly inform each other of changes in details.'),
          clause('11.4.', 'Amendments and additions to the Contract are valid only when made in writing, signed by authorised representatives and sealed.'),
          clause('11.5.', 'The Parties agreed that documents related to the Contract and sent by fax or email have legal force; the date of receipt is the day of sending or automatic delivery notification.'),
          clause('11.6.', 'The text of the Contract and its Supplementary Agreements duly executed and sent by fax or email, signed and stamped, are equivalent to the original.'),
          clause('11.7.', 'Invalidity of any term does not affect the validity of other terms of the Contract.'),
          clause('11.8.', 'Matters not covered by this Contract shall be governed by the current legislation of the Republic of Uzbekistan.'),
          clause('11.9.', 'This Contract is drawn up in English in two copies of equal legal force, one for each Party.'),
        ],
      },
    ],
    bankBlockHeading: '12. ADDRESSES AND BANK DETAILS OF THE PARTIES',
    expeditorLabel: '"FORWARDER"',
    clientLabel: '"CLIENT"',
    legalAddressLabel: 'Legal and actual address:',
    expeditorAddress: 'Republic of Uzbekistan, Tashkent, Yashnobod district, Botkin street 6/33',
    innLabel: 'TIN:',
    expeditorInn: '311 278 526',
    bankDetailsLabel: 'Bank details:',
    expeditorBank: '"Kapital Bank" JSCB, Tashkent',
    expeditorMfo: 'MFO 01158',
    expeditorBankInn: 'Bank TIN: 207 275 139',
    expeditorAccount: 'Account: 20208 000 6 07053373 001 (UZS)',
    corrBankLabel: 'Correspondent bank:',
    corrBankName: 'THE BANK OF NEW YORK MELLON',
    corrBankAddress: 'US-NY10286',
    corrBankSwift: 'SWIFT: IRVTUS3N',
    directorLabel: 'Director',
    expeditorDirector: 'Saydakbarov K.S. _________________________',
  },
};

// ─── Build a Document from one locale's content ────────────────────────────
function buildDoc(locale) {
  const c = CONTENT[locale];
  const children = [];

  // Title
  children.push(center(run(c.titleLine1, { bold: true, size: 32 }), { after: 100 }));
  children.push(center(run(c.titleLine2, { bold: true, size: 24 }), { after: 200 }));

  // City + date row
  children.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 160 },
      children: [
        run(c.city),
        run('                                                                                                                                   '),
        run(P.date),
      ],
    }),
  );

  // Parties intro
  children.push(p(c.parties));

  // Sections
  for (const section of c.sections) {
    children.push(heading(section.heading));
    for (const body of section.body) {
      children.push(body instanceof Paragraph ? body : p(body));
    }
  }

  // Bank details block
  children.push(heading(c.bankBlockHeading));
  children.push(
    bankTable(
      [
        [run(c.expeditorLabel, { bold: true }), run(' '), run('DAS PAY LLC', { bold: true })],
        [run(c.legalAddressLabel, { bold: true })],
        [run(c.expeditorAddress)],
        [run(`${c.innLabel} ${c.expeditorInn}`)],
        [run(c.bankDetailsLabel, { bold: true })],
        [run(c.expeditorBank)],
        [run(c.expeditorMfo)],
        [run(c.expeditorBankInn)],
        [run(c.expeditorAccount)],
        [run(c.corrBankLabel, { bold: true })],
        [run(c.corrBankName)],
        [run(c.corrBankAddress)],
        [run(c.corrBankSwift)],
        [run('')],
        [run(c.directorLabel, { bold: true })],
        [run(c.expeditorDirector)],
      ],
      [
        [run(c.clientLabel, { bold: true }), run(' '), run(P.name, { bold: true })],
        [run(c.legalAddressLabel, { bold: true })],
        [run(P.address)],
        [run(`${c.innLabel} `), run(P.inn)],
        [run(c.bankDetailsLabel, { bold: true })],
        [run(P.bank)],
        [run('MFO '), run(P.mfo)],
        [run(`${c.innLabel} `), run(P.bankInn)],
        [run(P.bankNum)],
        [run(c.corrBankLabel, { bold: true })],
        [run(P.corr)],
        [run(P.corrAdr)],
        [run(P.corrSwift)],
        [run('')],
        [run(c.directorLabel, { bold: true })],
        [run(P.director), run(' ___________________')],
      ],
    ),
  );

  return new Document({
    creator: 'DasPay',
    title: c.titleLine1,
    styles: {
      default: {
        document: { run: { font: FONT, size: 24 } },
      },
    },
    sections: [{ children }],
  });
}

// ─── Write both locales ────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    throw new Error(`Templates directory not found: ${TEMPLATES_DIR}`);
  }
  for (const locale of ['uz', 'en']) {
    const doc = buildDoc(locale);
    const buf = await Packer.toBuffer(doc);
    const out = path.join(TEMPLATES_DIR, CONTENT[locale].fileName);
    fs.writeFileSync(out, buf);
    console.log(`  ✓ ${locale.toUpperCase()} → ${path.relative(process.cwd(), out)} (${buf.length.toLocaleString()} B)`);
  }
  console.log('Done. Templates ready for docxtemplater.');
}

main().catch((err) => {
  console.error('Template generation failed:', err);
  process.exit(1);
});
