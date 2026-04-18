import { prisma } from './prisma';

export interface QuoteInput {
  originCountry: string;
  originCity?: string;
  destCountry: string;
  destCity?: string;
  mode?: string;
  weightKg: number;
}

export interface QuoteResult {
  price: number;
  currency: string;
  transitDays: number | null;
  breakdown: {
    baseFee: number;
    weightCost: number;
    weightBilled: number;
  };
  tariffId: number | null;
  tariffName: string | null;
  fallbackUsed: boolean;
}

function normalize(s: string | undefined | null): string {
  return (s || '').trim().toLowerCase();
}

function scoreTariff(
  t: {
    originCountry: string;
    originCity: string | null;
    destCountry: string;
    destCity: string | null;
    mode: string;
  },
  input: QuoteInput,
): number {
  let score = 0;
  if (normalize(t.originCountry) === normalize(input.originCountry)) score += 4;
  if (normalize(t.destCountry) === normalize(input.destCountry)) score += 4;
  if (t.originCity && normalize(t.originCity) === normalize(input.originCity)) score += 2;
  if (t.destCity && normalize(t.destCity) === normalize(input.destCity)) score += 2;
  if (input.mode && normalize(t.mode) === normalize(input.mode)) score += 1;
  return score;
}

export async function computeQuote(input: QuoteInput): Promise<QuoteResult> {
  const tariffs = await prisma.tariff.findMany({
    where: { active: true },
  });

  const matching = tariffs
    .map((t) => ({ tariff: t, score: scoreTariff(t, input) }))
    .filter((x) => x.score >= 8)
    .sort((a, b) => b.score - a.score);

  if (matching.length > 0) {
    const t = matching[0].tariff;
    const billedWeight = Math.max(input.weightKg, t.minWeight || 0);
    const weightCost = billedWeight * t.pricePerKg;
    const price = t.baseFee + weightCost;
    return {
      price: Math.round(price * 100) / 100,
      currency: t.currency,
      transitDays: t.transitDays ?? null,
      breakdown: { baseFee: t.baseFee, weightCost, weightBilled: billedWeight },
      tariffId: t.id,
      tariffName: t.name,
      fallbackUsed: false,
    };
  }

  // Fallback — simple rule of thumb
  const fallbackRate = 2.5;
  const price = Math.round(input.weightKg * fallbackRate * 100) / 100;
  return {
    price,
    currency: 'USD',
    transitDays: null,
    breakdown: { baseFee: 0, weightCost: price, weightBilled: input.weightKg },
    tariffId: null,
    tariffName: null,
    fallbackUsed: true,
  };
}
