'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { submitFeedback } from '@/app/actions/feedback';

const CATEGORIES: { key: string; label: string; emoji: string }[] = [
  { key: 'speed', label: 'Tezlik', emoji: '⚡' },
  { key: 'communication', label: 'Aloqa', emoji: '💬' },
  { key: 'price', label: 'Narx', emoji: '💰' },
  { key: 'packaging', label: "Qadoqlash", emoji: '📦' },
  { key: 'other', label: 'Boshqa', emoji: '✨' },
];

export function FeedbackForm({ token }: { token: string }) {
  const [score, setScore] = useState<number | null>(null);
  const [category, setCategory] = useState<string>('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (score === null) {
      setError("Iltimos, 0 dan 10 gacha baho tanlang");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await submitFeedback({ token, score, comment, category });
    setSubmitting(false);
    if (!res.success) {
      setError(res.error || 'Xatolik yuz berdi');
      return;
    }
    setDone(true);
    setTimeout(() => window.location.reload(), 900);
  }

  if (done) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-[#185FA5]" />
      </div>
    );
  }

  const scoreColor = (n: number) =>
    n <= 6 ? 'bg-red-500' : n <= 8 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Bizni tanishlaringizga tavsiya qilarmidingiz?
        </label>
        <div className="grid grid-cols-11 gap-1">
          {Array.from({ length: 11 }, (_, n) => (
            <button
              type="button"
              key={n}
              onClick={() => setScore(n)}
              className={`flex h-10 items-center justify-center rounded-lg text-sm font-bold transition-all ${
                score === n
                  ? `${scoreColor(n)} text-white shadow-md scale-105`
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
          <span>Umuman tavsiya etmayman</span>
          <span>Albatta tavsiya etaman</span>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Nima eng ko&apos;p ta&apos;sir qildi? (ixtiyoriy)
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.key}
              onClick={() => setCategory(category === c.key ? '' : c.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                category === c.key
                  ? 'border-[#185FA5] bg-[#185FA5] text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Izoh (ixtiyoriy)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Tajribangiz haqida qisqacha yozing..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-inner focus:border-[#185FA5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <div className="mt-1 text-right text-[11px] text-slate-400">{comment.length} / 1000</div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || score === null}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#042C53] to-[#185FA5] px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Yuborish
      </button>
    </form>
  );
}
