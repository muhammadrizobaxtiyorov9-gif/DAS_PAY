export type Currency = 'USD' | 'UZS' | 'RUB' | 'EUR';

export function formatMoney(amount: number, currency: string = 'USD'): string {
  const c = currency.toUpperCase() as Currency;
  const decimals = c === 'UZS' ? 0 : 2;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const symbol = currencySymbol(c);
  return c === 'UZS' ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
}

export function currencySymbol(currency: string): string {
  switch (currency.toUpperCase()) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'RUB':
      return '₽';
    case 'UZS':
      return "so'm";
    default:
      return currency;
  }
}

export function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function generateInvoiceNumber(year: number, sequence: number): string {
  return `INV-${year}-${sequence.toString().padStart(5, '0')}`;
}
