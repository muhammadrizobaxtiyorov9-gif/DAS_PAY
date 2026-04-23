/**
 * Wagon Status Lifecycle
 * 7 statuses: available → assigned → in_transit → at_station → returning → maintenance → needs_repair
 */

export type WagonStatusKey =
  | 'available'
  | 'assigned'
  | 'in_transit'
  | 'at_station'
  | 'returning'
  | 'maintenance'
  | 'needs_repair';

export const WAGON_STATUSES: Record<WagonStatusKey, {
  label: { uz: string; ru: string; en: string };
  color: string;
  bgColor: string;
  pill: string;
  dot: string;
  icon: string;
}> = {
  available: {
    label: { uz: "Bo'sh (Soz)", ru: 'Свободен (Исправен)', en: 'Available' },
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-600/10',
    pill: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    icon: '🟢',
  },
  assigned: {
    label: { uz: 'Biriktirilgan', ru: 'Назначен', en: 'Assigned' },
    color: 'text-blue-600',
    bgColor: 'bg-blue-600/10',
    pill: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
    icon: '🔵',
  },
  in_transit: {
    label: { uz: "Yo'lda", ru: 'В пути', en: 'In Transit' },
    color: 'text-orange-600',
    bgColor: 'bg-orange-600/10',
    pill: 'bg-orange-100 text-orange-700',
    dot: 'bg-orange-500',
    icon: '🟠',
  },
  at_station: {
    label: { uz: 'Stansiyada', ru: 'На станции', en: 'At Station' },
    color: 'text-purple-600',
    bgColor: 'bg-purple-600/10',
    pill: 'bg-purple-100 text-purple-700',
    dot: 'bg-purple-500',
    icon: '🟣',
  },
  returning: {
    label: { uz: 'Qaytmoqda', ru: 'Возвращается', en: 'Returning' },
    color: 'text-amber-600',
    bgColor: 'bg-amber-600/10',
    pill: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    icon: '🟡',
  },
  maintenance: {
    label: { uz: 'Remontda', ru: 'На ремонте', en: 'Maintenance' },
    color: 'text-red-600',
    bgColor: 'bg-red-600/10',
    pill: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
    icon: '🔴',
  },
  needs_repair: {
    label: { uz: 'Remont talab', ru: 'Требует ремонта', en: 'Needs Repair' },
    color: 'text-pink-600',
    bgColor: 'bg-pink-600/10',
    pill: 'bg-pink-100 text-pink-700',
    dot: 'bg-pink-500',
    icon: '🔧',
  },
};

const FALLBACK_WAGON_STATUS = {
  label: { uz: "Noma'lum", ru: 'Неизвестно', en: 'Unknown' },
  color: 'text-slate-600',
  bgColor: 'bg-slate-600/10',
  pill: 'bg-slate-100 text-slate-600',
  dot: 'bg-slate-400',
  icon: '⚪',
};

export function wagonStatusMeta(status: string | null | undefined, locale: 'uz' | 'ru' | 'en' = 'uz') {
  if (!status) return { ...FALLBACK_WAGON_STATUS, labelText: FALLBACK_WAGON_STATUS.label[locale] };
  const s = WAGON_STATUSES[status as WagonStatusKey] || FALLBACK_WAGON_STATUS;
  return { ...s, labelText: s.label[locale] || status };
}

/** Valid status transitions */
export const WAGON_TRANSITIONS: Record<WagonStatusKey, WagonStatusKey[]> = {
  available: ['assigned', 'maintenance', 'needs_repair'],
  assigned: ['in_transit', 'available', 'maintenance', 'needs_repair'],
  in_transit: ['at_station', 'maintenance', 'needs_repair'],
  at_station: ['returning', 'available', 'maintenance', 'needs_repair'],
  returning: ['available', 'at_station', 'maintenance', 'needs_repair'],
  maintenance: ['available', 'needs_repair'],
  needs_repair: ['available', 'maintenance'],
};

export function canTransitionWagon(from: string, to: string): boolean {
  const allowed = WAGON_TRANSITIONS[from as WagonStatusKey];
  if (!allowed) return false;
  return allowed.includes(to as WagonStatusKey);
}

/** Status key'lardan faqat yukka biriktirilishi mumkin bo'lganlarini qaytaradi */
export function isWagonAvailableForAssignment(status: string): boolean {
  return status === 'available';
}
