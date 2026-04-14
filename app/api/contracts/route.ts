import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ─── Validation ───────────────────────────────────────────────────────────────

const innRegex = /^\d{3}\s\d{3}\s\d{3}$/;

const contractSchema = z
  .object({
    companyName: z.string().min(2).max(200),
    companyDirector: z.string().min(2).max(200),
    companyAddress: z.string().min(5).max(300),
    companyInn: z.string().regex(innRegex),
    companyBank: z.string().min(2).max(200),
    bankMfo: z.string().regex(/^\d{5}$/),
    bankInn: z.string().regex(innRegex),
    bankNum: z.string().min(16).max(30),
    bankCurrency: z.enum(['UZS', 'USD']),
    hasCorrespondent: z.boolean(),
    bankCorrName: z.string().optional(),
    bankCorrAddress: z.string().optional(),
    bankCorrSwift: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.hasCorrespondent) {
      if (!data.bankCorrName || data.bankCorrName.length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Required', path: ['bankCorrName'] });
      }
      if (!data.bankCorrAddress || data.bankCorrAddress.length < 5) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Required', path: ['bankCorrAddress'] });
      }
      if (!data.bankCorrSwift || data.bankCorrSwift.length < 8) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Required', path: ['bankCorrSwift'] });
      }
    }
  });

// ─── In-memory counter (fallback when no DB) ──────────────────────────────────
// Uses globalThis to persist across hot-reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var __contractCounter: number | undefined;
}
const getNextNumber = (): number => {
  if (typeof globalThis.__contractCounter !== 'number') {
    globalThis.__contractCounter = 0;
  }
  globalThis.__contractCounter += 1;
  return globalThis.__contractCounter;
};

// ─── Russian month names ──────────────────────────────────────────────────────

const RU_MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

function buildContractDate(): string {
  const now = new Date();
  return `«${now.getDate()}» ${RU_MONTHS[now.getMonth()]} ${now.getFullYear()}г.`;
}

// ─── Try to use Prisma if DATABASE_URL is configured ─────────────────────────

async function saveContractToDB(
  data: z.infer<typeof contractSchema>,
  contractDate: string
): Promise<number> {
  if (!process.env.DATABASE_URL) {
    // No DB configured — use in-memory counter
    return getNextNumber();
  }

  try {
    const { default: prisma } = await import('@/lib/prisma');
    const contract = await prisma.contract.create({
      data: {
        contractDate,
        companyName: data.companyName,
        companyDirector: data.companyDirector,
        companyAddress: data.companyAddress,
        companyInn: data.companyInn,
        companyBank: data.companyBank,
        bankMfo: data.bankMfo,
        bankInn: data.bankInn,
        bankNum: data.bankNum,
        bankCurrency: data.bankCurrency,
        hasCorrespondent: data.hasCorrespondent,
        bankCorrName: data.bankCorrName || null,
        bankCorrAddress: data.bankCorrAddress || null,
        bankCorrSwift: data.bankCorrSwift || null,
      },
    });
    return contract.contractNumber;
  } catch (err) {
    console.warn('[contracts] DB not available, using in-memory counter:', err);
    return getNextNumber();
  }
}

// ─── POST /api/contracts ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = contractSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Неверные данные', errors: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const contractDate = buildContractDate();
    const contractNumber = await saveContractToDB(data, contractDate);

    return NextResponse.json(
      { contractNumber, contractDate, data },
      { status: 201 }
    );
  } catch (err) {
    console.error('[contracts] POST error:', err);
    return NextResponse.json({ message: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

// ─── GET /api/contracts ───────────────────────────────────────────────────────

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ contracts: [], note: 'DATABASE_URL not configured' });
  }

  try {
    const { default: prisma } = await import('@/lib/prisma');
    const contracts = await prisma.contract.findMany({
      orderBy: { contractNumber: 'desc' },
      take: 100,
      select: {
        id: true,
        contractNumber: true,
        contractDate: true,
        companyName: true,
        companyDirector: true,
        bankCurrency: true,
        status: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ contracts });
  } catch (err) {
    console.error('[contracts] GET error:', err);
    return NextResponse.json({ message: 'Внутренняя ошибка' }, { status: 500 });
  }
}
