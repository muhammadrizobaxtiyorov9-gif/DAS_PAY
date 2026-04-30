import { prisma } from './prisma';

export interface QuoteInput {
  originCountry: string;
  originCity?: string;
  destCountry: string;
  destCity?: string;
  originStationId?: number;
  destStationId?: number;
  mode?: string;
  /** Weight in tonnes */
  weightTon: number;
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
  /** True when no matching tariff was found — managers will calculate manually */
  noTariffFound: boolean;
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
    originStationId: number | null;
    destStationId: number | null;
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
  
  // High weight for exact station matches if provided
  if (t.mode === 'train') {
    if (t.originStationId && input.originStationId && t.originStationId === input.originStationId) score += 10;
    if (t.destStationId && input.destStationId && t.destStationId === input.destStationId) score += 10;
  }
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
    // pricePerKg field now semantically stores price-per-ton
    const billedWeight = Math.max(input.weightTon, t.minWeight || 0);
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
      noTariffFound: false,
    };
  }

  // No matching tariff found — managers will calculate manually
  return {
    price: 0,
    currency: 'USD',
    transitDays: null,
    breakdown: { baseFee: 0, weightCost: 0, weightBilled: input.weightTon },
    tariffId: null,
    tariffName: null,
    fallbackUsed: true,
    noTariffFound: true,
  };
}
