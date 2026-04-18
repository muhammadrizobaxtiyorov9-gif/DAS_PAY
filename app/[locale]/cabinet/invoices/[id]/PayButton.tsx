'use client';

import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { initiateInvoicePayment } from '@/app/actions/payments';

export function PayButton({ invoiceId, disabled }: { invoiceId: number; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<'click' | 'payme' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handle = async (provider: 'click' | 'payme') => {
    setLoading(provider);
    setError(null);
    try {
      const result = await initiateInvoicePayment(invoiceId, provider);
      window.location.href = result.checkoutUrl;
    } catch (e) {
      setError((e as Error).message);
      setLoading(null);
    }
  };

  if (disabled) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
      >
        <CreditCard className="h-4 w-4" /> Onlayn to'lash
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="mb-4 text-lg font-bold text-slate-800">To'lov usulini tanlang</h3>
            <div className="space-y-2">
              <ProviderButton
                name="Click"
                onClick={() => handle('click')}
                loading={loading === 'click'}
                disabled={!!loading}
                color="bg-[#00AEEF] hover:bg-[#0098CF]"
              />
              <ProviderButton
                name="Payme"
                onClick={() => handle('payme')}
                loading={loading === 'payme'}
                disabled={!!loading}
                color="bg-[#3CAC69] hover:bg-[#2E9B5A]"
              />
            </div>
            {error && (
              <div className="mt-3 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">{error}</div>
            )}
            <button
              onClick={() => !loading && setOpen(false)}
              disabled={!!loading}
              className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Bekor qilish
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ProviderButton({
  name,
  onClick,
  loading,
  disabled,
  color,
}: {
  name: string;
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold text-white shadow disabled:opacity-50 ${color}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
      {name} orqali to'lash
    </button>
  );
}
