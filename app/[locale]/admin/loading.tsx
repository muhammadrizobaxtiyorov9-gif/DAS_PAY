import { Loader2 } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="w-full h-full min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
        <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
      </div>
    </div>
  );
}
