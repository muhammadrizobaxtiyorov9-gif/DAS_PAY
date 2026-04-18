import 'server-only';

export type PaymentProvider = 'click' | 'payme';

export interface CheckoutLinkParams {
  paymentId: number;
  invoiceNumber: string;
  amountUZS: number;
  returnUrl: string;
}

/**
 * Build a hosted checkout URL for the given provider.
 * Credentials are read from env:
 *   CLICK_MERCHANT_ID, CLICK_SERVICE_ID
 *   PAYME_MERCHANT_ID
 * When missing, a stub dev URL is returned so the flow is testable end-to-end.
 */
export function buildCheckoutUrl(provider: PaymentProvider, params: CheckoutLinkParams): string {
  if (provider === 'click') {
    const merchantId = process.env.CLICK_MERCHANT_ID;
    const serviceId = process.env.CLICK_SERVICE_ID;
    if (!merchantId || !serviceId) {
      return `${params.returnUrl}?dev_provider=click&payment=${params.paymentId}`;
    }
    const amountTiyin = Math.round(params.amountUZS * 100);
    const transactParam = params.paymentId.toString();
    return (
      `https://my.click.uz/services/pay` +
      `?service_id=${encodeURIComponent(serviceId)}` +
      `&merchant_id=${encodeURIComponent(merchantId)}` +
      `&amount=${amountTiyin}` +
      `&transaction_param=${encodeURIComponent(transactParam)}` +
      `&return_url=${encodeURIComponent(params.returnUrl)}`
    );
  }

  // Payme: base64-encoded query per https://developer.help.paycom.uz
  const merchantId = process.env.PAYME_MERCHANT_ID;
  if (!merchantId) {
    return `${params.returnUrl}?dev_provider=payme&payment=${params.paymentId}`;
  }
  const amountTiyin = Math.round(params.amountUZS * 100);
  const query = `m=${merchantId};ac.payment_id=${params.paymentId};a=${amountTiyin};c=${params.returnUrl}`;
  const b64 = Buffer.from(query, 'utf8').toString('base64');
  return `https://checkout.paycom.uz/${b64}`;
}

export function providerLabel(p: PaymentProvider): string {
  return p === 'click' ? 'Click' : 'Payme';
}
