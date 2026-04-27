'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

/**
 * Catches the browser's `beforeinstallprompt` event and surfaces it as a
 * dismissable banner. Only shows on Android Chromium / Edge / Samsung
 * Internet — iOS Safari does not fire the event (users have to use the
 * native Share → Add to Home Screen flow). We respect a localStorage
 * dismissal so the prompt doesn't reappear on every page load.
 */

const DISMISS_KEY = 'daspay:pwa:install_dismissed';
const DISMISS_DAYS = 14;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Don't re-show if user dismissed recently or app is already installed
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const ageDays = (Date.now() - dismissedAt) / 86_400_000;
    if (dismissedAt && ageDays < DISMISS_DAYS) return;
    if (window.matchMedia?.('(display-mode: standalone)').matches) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const dismiss = () => {
    setHidden(true);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  const install = async () => {
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    setHidden(true);
  };

  if (hidden || !event) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl shadow-blue-500/20 sm:left-auto sm:right-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
          <Download className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900">DasPay ilovasini o&apos;rnating</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Telefon ekraniga qo&apos;shing — tezroq kirish va offline ishlash uchun.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={install}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              O&apos;rnatish
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              Keyinroq
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Yopish"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
