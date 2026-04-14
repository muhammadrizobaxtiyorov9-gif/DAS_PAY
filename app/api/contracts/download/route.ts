import { NextRequest, NextResponse } from 'next/server';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import * as fs from 'fs';
import * as path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

// ─── POST /api/contracts/download ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { contractNumber, contractDate, data } = body;

    // Load the template from the templates folder
    const templatePath = path.join(process.cwd(), 'templates', 'договор.docx');
    
    let content: Buffer;
    try {
      content = fs.readFileSync(templatePath);
    } catch (err) {
      console.error('[contracts/download] Template missing:', err);
      return NextResponse.json({ message: 'Шаблон договора не найден (template missing)' }, { status: 500 });
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

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''%D0%94%D0%BE%D0%B3%D0%BE%D0%B2%D0%BE%D1%80_%E2%84%96${contractNumber}_DasPay.docx`,
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
