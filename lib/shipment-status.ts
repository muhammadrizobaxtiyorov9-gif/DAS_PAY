export type ShipmentStatusKey =
  | 'pending'
  | 'in_transit'
  | 'customs'
  | 'delivered'
  | 'cancelled'
  | 'delayed';

interface StatusMeta {
  label: string;
  /** Tailwind pill: background + text color, no borders. Safe on light surfaces. */
  pill: string;
  /** Dot color for timeline/indicator use. */
  dot: string;
}

const META: Record<string, StatusMeta> = {
  pending: { label: 'Kutilmoqda', pill: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  processing: { label: 'Tayyorlanmoqda', pill: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  in_transit: { label: "Yo'lda", pill: 'bg-blue-100 text-[#185FA5]', dot: 'bg-[#185FA5]' },
  customs: { label: 'Bojxonada', pill: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  delivered: { label: 'Yetkazildi', pill: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { label: 'Bekor qilindi', pill: 'bg-slate-200 text-slate-600', dot: 'bg-slate-400' },
  delayed: { label: 'Kechikmoqda', pill: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
};

const FALLBACK: StatusMeta = {
  label: 'Noma\'lum',
  pill: 'bg-slate-100 text-slate-600',
  dot: 'bg-slate-400',
};

export function shipmentStatusMeta(status: string | null | undefined): StatusMeta {
  if (!status) return FALLBACK;
  return META[status] ?? { ...FALLBACK, label: status };
}
