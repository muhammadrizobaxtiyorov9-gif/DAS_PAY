import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full"></div>
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin relative z-10" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Yuklanmoqda...</p>
      </div>
    </div>
  );
}
