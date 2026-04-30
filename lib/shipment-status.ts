import { 
  FileText, 
  Train, 
  PackageCheck, 
  ClipboardCheck, 
  ShieldCheck, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Download,
  Package,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

export type ShipmentStatusKey = 
  | 'pending'
  | 'wagons_arrived'
  | 'loaded'
  | 'docs_ready'
  | 'customs_cleared'
  | 'in_transit'
  | 'arrived_at_station'
  | 'delivered'
  | 'unloaded'
  | 'cancelled'
  | 'delayed'
  | 'confirmed'
  | 'arrived_at_loading';

export const SHIPMENT_STATUSES: Record<ShipmentStatusKey, {
  label: { uz: string; ru: string; en: string };
  color: string;
  bgColor: string;
  pill: string;
  dot: string;
  icon: any;
}> = {
  pending: {
    label: { uz: 'Ariza qabul qilindi', ru: 'Заявка принята', en: 'Application accepted' },
    color: 'text-amber-600',
    bgColor: 'bg-amber-600/10',
    pill: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    icon: FileText,
  },
  confirmed: {
    label: { uz: 'Tasdiqlandi', ru: 'Подтверждено', en: 'Confirmed' },
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-600/10',
    pill: 'bg-indigo-100 text-indigo-700',
    dot: 'bg-indigo-500',
    icon: CheckCircle2,
  },
  arrived_at_loading: {
    label: { uz: 'Yuklash manziliga yetib keldi', ru: 'Прибыл на место погрузки', en: 'Arrived at loading location' },
    color: 'text-blue-600',
    bgColor: 'bg-blue-600/10',
    pill: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
    icon: MapPin,
  },
  wagons_arrived: {
    label: { uz: 'Vagonlar stansiyaga yetib keldi', ru: 'Вагоны прибыли на станцию', en: 'Wagons arrived at station' },
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    pill: 'bg-orange-100 text-orange-700',
    dot: 'bg-orange-500',
    icon: Train,
  },
  loaded: {
    label: { uz: 'Yuk yuklandi', ru: 'Груз погружен', en: 'Cargo loaded' },
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-600/10',
    pill: 'bg-yellow-100 text-yellow-700',
    dot: 'bg-yellow-500',
    icon: PackageCheck,
  },
  docs_ready: {
    label: { uz: 'Hujjatlar rasmiylashtirildi', ru: 'Документы оформлены', en: 'Documents processed' },
    color: 'text-sky-600',
    bgColor: 'bg-sky-600/10',
    pill: 'bg-sky-100 text-sky-700',
    dot: 'bg-sky-500',
    icon: ClipboardCheck,
  },
  customs_cleared: {
    label: { uz: 'Bojxona hujjatlari rasmiylashtirildi', ru: 'Таможенное оформление завершено', en: 'Customs cleared' },
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-600/10',
    pill: 'bg-indigo-100 text-indigo-700',
    dot: 'bg-indigo-500',
    icon: ShieldCheck,
  },
  in_transit: {
    label: { uz: 'Yuk yo\'lga chiqdi', ru: 'Груз в пути', en: 'Cargo in transit' },
    color: 'text-[#185FA5]',
    bgColor: 'bg-[#185FA5]/10',
    pill: 'bg-blue-100 text-[#185FA5]',
    dot: 'bg-[#185FA5]',
    icon: Truck,
  },
  arrived_at_station: {
    label: { uz: 'Stansiyaga yetib keldi', ru: 'Прибыло на станцию назначения', en: 'Arrived at station' },
    color: 'text-teal-600',
    bgColor: 'bg-teal-600/10',
    pill: 'bg-teal-100 text-teal-700',
    dot: 'bg-teal-500',
    icon: MapPin,
  },
  delivered: {
    label: { uz: 'Yuk manzilga yetkazildi', ru: 'Груз доставлен', en: 'Cargo delivered' },
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-600/10',
    pill: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  unloaded: {
    label: { uz: 'Yuk tushirib olindi', ru: 'Груз выгружен', en: 'Cargo unloaded' },
    color: 'text-green-700',
    bgColor: 'bg-green-700/10',
    pill: 'bg-green-100 text-green-800',
    dot: 'bg-green-600',
    icon: Download,
  },
  cancelled: {
    label: { uz: 'Bekor qilindi', ru: 'Отменено', en: 'Cancelled' },
    color: 'text-slate-600',
    bgColor: 'bg-slate-600/10',
    pill: 'bg-slate-200 text-slate-600',
    dot: 'bg-slate-400',
    icon: XCircle,
  },
  delayed: {
    label: { uz: 'Kechikmoqda', ru: 'Задерживается', en: 'Delayed' },
    color: 'text-red-600',
    bgColor: 'bg-red-600/10',
    pill: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
    icon: AlertCircle,
  }
};

const FALLBACK = {
  label: { uz: 'Noma\'lum', ru: 'Неизвестно', en: 'Unknown' },
  color: 'text-slate-600',
  bgColor: 'bg-slate-600/10',
  pill: 'bg-slate-100 text-slate-600',
  dot: 'bg-slate-400',
  icon: Package
};

export function shipmentStatusMeta(status: string | null | undefined, locale: 'uz' | 'ru' | 'en' = 'uz') {
  if (!status) return { ...FALLBACK, labelText: FALLBACK.label[locale] };
  const s = SHIPMENT_STATUSES[status as ShipmentStatusKey] || FALLBACK;
  return {
    ...s,
    labelText: s.label[locale] || status
  };
}
