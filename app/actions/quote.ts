'use server';

import { computeQuote, type QuoteInput, type QuoteResult } from '@/lib/quote';

export async function getQuote(input: QuoteInput): Promise<QuoteResult> {
  return computeQuote(input);
}
