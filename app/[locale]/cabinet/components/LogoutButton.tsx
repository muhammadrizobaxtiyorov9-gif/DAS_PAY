'use client';

import { LogOut } from 'lucide-react';

export function LogoutButton({ locale }: { locale: string }) {
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = `/${locale}/login`;
    } catch (e) {}
  };

  return (
    <button
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600 group"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 transition-colors group-hover:bg-red-100/50">
         <LogOut className="h-[18px] w-[18px]" />
      </div>
      <span>Tizimdan chiqish</span>
    </button>
  );
}
