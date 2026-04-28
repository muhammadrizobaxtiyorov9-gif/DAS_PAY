'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Printer,
  Send,
  CheckCircle2,
  Trash2,
  Bell,
  Loader2,
  XCircle,
} from 'lucide-react';
import {
  updateInvoiceStatus,
  deleteInvoice,
  sendInvoiceReminder,
} from '@/app/actions/admin';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { toast } from 'sonner';

interface InvoiceActionsProps {
  invoiceId: number;
  status: string;
  total: number;
  paidAmount: number;
  hasTelegram: boolean;
}

export function InvoiceActions({
  invoiceId,
  status,
  total,
  paidAmount,
  hasTelegram,
}: InvoiceActionsProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  function notify(text: string, ok = true) {
    if (ok) toast.success(text);
    else toast.error(text);
  }

  function handleSend() {
    setBusy('send');
    startTransition(async () => {
      const r = await updateInvoiceStatus(invoiceId, 'sent');
      setBusy(null);
      if (r.success) {
        notify('Invoys "yuborilgan" deb belgilandi');
        router.refresh();
      } else notify(r.error || 'Xatolik', false);
    });
  }

  function handlePaid() {
    const input = prompt("To'langan summa (to'liq summa avto):", String(total));
    if (input === null) return;
    const amt = parseFloat(input) || total;
    setBusy('pay');
    startTransition(async () => {
      const r = await updateInvoiceStatus(invoiceId, 'paid', amt);
      setBusy(null);
      if (r.success) {
        notify("To'lov qabul qilindi");
        router.refresh();
      } else notify(r.error || 'Xatolik', false);
    });
  }

  async function handleCancel() {
    const ok = await confirm({
      title: 'Invoysni bekor qilish',
      message: 'Invoysni bekor qilishni tasdiqlaysizmi?',
      variant: 'warning'
    });
    if (!ok) return;
    setBusy('cancel');
    startTransition(async () => {
      const r = await updateInvoiceStatus(invoiceId, 'cancelled');
      setBusy(null);
      if (r.success) {
        notify('Invoys bekor qilindi');
        router.refresh();
      } else notify(r.error || 'Xatolik', false);
    });
  }

  function handleReminder() {
    setBusy('remind');
    startTransition(async () => {
      const r = await sendInvoiceReminder(invoiceId);
      setBusy(null);
      if (r.success) notify('Telegram orqali eslatma yuborildi');
      else notify(r.error || 'Eslatma yuborilmadi', false);
    });
  }

  async function handleDelete() {
    const ok = await confirm({
      title: 'Invoysni o\'chirish',
      message: 'Invoysni o\'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo\'lmaydi.',
      variant: 'danger'
    });
    if (!ok) return;
    setBusy('delete');
    startTransition(async () => {
      const r = await deleteInvoice(invoiceId);
      setBusy(null);
      if (r.success) {
        router.push('/uz/admin/invoices');
      } else notify(r.error || 'Xatolik', false);
    });
  }

  const unpaid = paidAmount < total;
  const canSend = status === 'draft';
  const canMarkPaid = (status === 'sent' || status === 'overdue' || status === 'draft') && unpaid;
  const canRemind = (status === 'sent' || status === 'overdue') && unpaid && hasTelegram;
  const canCancel = status !== 'cancelled' && status !== 'paid';

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">

      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <Printer className="h-4 w-4" /> Chop etish
      </button>

      {canSend && (
        <button
          onClick={handleSend}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {busy === 'send' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Yuborildi deb belgilash
        </button>
      )}

      {canRemind && (
        <button
          onClick={handleReminder}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
        >
          {busy === 'remind' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          Eslatma
        </button>
      )}

      {canMarkPaid && (
        <button
          onClick={handlePaid}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy === 'pay' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          To'langan
        </button>
      )}

      {canCancel && (
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          {busy === 'cancel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          Bekor qilish
        </button>
      )}

      <button
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
      >
        {busy === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        O'chirish
      </button>
    </div>
  );
}
