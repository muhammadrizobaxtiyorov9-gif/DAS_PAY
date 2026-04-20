import { NextRequest, NextResponse } from 'next/server';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import * as fs from 'fs';
import * as path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

type ContractLocale = 'ru' | 'uz' | 'en';

interface ContractData {
  companyName: string;
  companyDirector: string;
  companyAddress: string;
  companyInn: string;
  companyBank: string;
  bankMfo: string;
  bankInn: string;
  bankNum: string;
  bankCurrency: 'UZS' | 'USD';
  hasCorrespondent: boolean;
  bankCorrName?: string;
  bankCorrAddress?: string;
  bankCorrSwift?: string;
}

interface RequestBody {
  contractNumber: number;
  contractDate: string;
  data: ContractData;
  locale?: ContractLocale;
}

const TEMPLATE_FILES: Record<ContractLocale, string> = {
  ru: 'договор.docx',
  uz: 'shartnoma.docx',
  en: 'contract.docx',
};

const FILENAME_PREFIX: Record<ContractLocale, string> = {
  ru: 'Договор',
  uz: 'Shartnoma',
  en: 'Contract',
};

function resolveTemplate(locale: ContractLocale): { buffer: Buffer; used: ContractLocale } {
  const order: ContractLocale[] = [locale, 'ru'];
  for (const l of order) {
    const p = path.join(process.cwd(), 'templates', TEMPLATE_FILES[l]);
    if (fs.existsSync(p)) {
      return { buffer: fs.readFileSync(p), used: l };
    }
  }
  throw new Error('No contract template found');
}

// ─── POST /api/contracts/download ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { contractNumber, contractDate, data, locale = 'ru' } = body;

    let content: Buffer;
    let usedLocale: ContractLocale;
    try {
      const resolved = resolveTemplate(locale);
      content = resolved.buffer;
      usedLocale = resolved.used;
    } catch (err) {
      console.error('[contracts/download] Template missing:', err);
      return NextResponse.json({ message: 'Contract template not found' }, { status: 500 });
    }

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Map frontend data to the exact placeholders inside "договор.docx"
    doc.render({
      d_number: contractNumber.toString(),
      'date()': contractDate,
      company_name: data.companyName,
      company_director: data.companyDirector,
      companyAddress: data.companyAddress, // using camelCase as patched in xml
      company_inn: data.companyInn,
      company_bank: data.companyBank,
      bank_mfo: data.bankMfo,
      bank_inn: data.bankInn,
      bank_num: `${data.bankNum} (${data.bankCurrency})`, // combining for simplicity or could separate
      
      // If no correspondent bank, we can leave these blank
      bank_corr: data.hasCorrespondent && data.bankCorrName ? data.bankCorrName : '',
      bank_corr_adress: data.hasCorrespondent && data.bankCorrAddress ? data.bankCorrAddress : '',
      bank_corr_swift: data.hasCorrespondent && data.bankCorrSwift ? `SWIFT: ${data.bankCorrSwift}` : '',
    });

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    const prefix = FILENAME_PREFIX[usedLocale];
    const filename = `${prefix}_${contractNumber}_DasPay.docx`;
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (err: any) {
    console.error('[contracts/download] error:', err);
    if (err.properties && err.properties.errors instanceof Array) {
        const errorMessages = err.properties.errors.map(function (error: any) {
            return error.properties.explanation;
        }).join("\n");
        console.log("Template rendering error messages:", errorMessages);
    }
    return NextResponse.json({ message: 'Ошибка генерации документа' }, { status: 500 });
  }
}
