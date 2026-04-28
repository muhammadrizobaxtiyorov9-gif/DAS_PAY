'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface FormSectionProps {
  title: string;
  icon: ReactNode;
  defaultOpen?: boolean;
  completed?: boolean;
  badge?: string;
  children: ReactNode;
}

export function FormSection({ title, icon, defaultOpen = false, completed, badge, children }: FormSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${open ? 'border-blue-200 bg-white shadow-sm' : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${open ? 'bg-blue-100 text-blue-700' : completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
          {completed && !open ? <Check className="h-4 w-4" /> : icon}
        </span>
        <span className="flex-1">
          <span className={`text-sm font-bold ${open ? 'text-slate-900' : 'text-slate-700'}`}>{title}</span>
        </span>
        {badge && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">{badge}</span>
        )}
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}
