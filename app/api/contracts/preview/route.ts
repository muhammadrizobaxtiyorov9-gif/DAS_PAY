import { NextRequest, NextResponse } from 'next/server';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import * as fs from 'fs';
import * as path from 'path';
import mammoth from 'mammoth';

type ContractLocale = 'ru' | 'uz' | 'en';

const TEMPLATE_FILES: Record<ContractLocale, string> = {
  ru: 'договор.docx',
  uz: 'shartnoma.docx',
  en: 'contract.docx',
};

function resolveTemplateBuffer(locale: ContractLocale): Buffer {
  const order: ContractLocale[] = [locale, 'ru'];
  for (const l of order) {
    const p = path.join(process.cwd(), 'templates', TEMPLATE_FILES[l]);
    if (fs.existsSync(p)) return fs.readFileSync(p);
  }
  throw new Error('No contract template found');
}

// ─── POST /api/contracts/preview ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { contractNumber, contractDate, data, locale = 'ru' } = await req.json();

    let content: Buffer;
    try {
      content = resolveTemplateBuffer(locale as ContractLocale);
    } catch (err) {
      return NextResponse.json({ message: 'Template not found' }, { status: 500 });
    }

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    doc.render({
      d_number: contractNumber.toString(),
      'date()': contractDate,
      company_name: data.companyName,
      company_director: data.companyDirector,
      companyAddress: data.companyAddress,
      company_inn: data.companyInn,
      company_bank: data.companyBank,
      bank_mfo: data.bankMfo,
      bank_inn: data.bankInn,
      bank_num: `${data.bankNum} (${data.bankCurrency})`,
      
      bank_corr: data.hasCorrespondent && data.bankCorrName ? data.bankCorrName : '',
      bank_corr_adress: data.hasCorrespondent && data.bankCorrAddress ? data.bankCorrAddress : '',
      bank_corr_swift: data.hasCorrespondent && data.bankCorrSwift ? `SWIFT: ${data.bankCorrSwift}` : '',
    });

    const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

    // Use mammoth to convert the generated DOCX buffer to HTML for the preview
    // We add some basic style mappings to preserve some layout structure
    const result = await mammoth.convertToHtml(
      { buffer: buf },
      {
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
        ],
      }
    );

    return NextResponse.json({ html: result.value });
  } catch (err: any) {
    console.error('[contracts/preview] error:', err);
    return NextResponse.json({ message: 'Ошибка генерации предпросмотра' }, { status: 500 });
  }
}
