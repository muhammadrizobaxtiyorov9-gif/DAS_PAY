'use client';

import { useRef, useState } from 'react';
import { ScanLine, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { DocumentKind } from '@/lib/ocr';

interface OcrScanButtonProps<T> {
  /** Which document type — controls the prompt + result schema. */
  kind: DocumentKind;
  /** Called with the extracted fields once OCR succeeds. */
  onExtracted: (fields: T, confidence?: number) => void;
  /** Button label override. */
  label?: string;
  className?: string;
}

const KIND_LABEL: Record<DocumentKind, string> = {
  cmr: 'CMR scan',
  inn: 'INN guvohnomasi',
  passport: 'Passport',
};

/**
 * Reusable "scan a document" button. Opens the file picker, sends the image
 * to /api/ocr/extract, and hands back the extracted fields. Drop in next to
 * any form section you want to auto-fill.
 */
export function OcrScanButton<T>({
  kind,
  onExtracted,
  label,
  className = '',
}: OcrScanButtonProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Fayl 8MB dan oshmasligi kerak");
      return;
    }
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast.error('JPEG, PNG yoki WebP rasm yuklang');
      return;
    }

    setBusy(true);
    const t0 = Date.now();
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('kind', kind);

      const res = await fetch('/api/ocr/extract', { method: 'POST', body: form });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        toast.error(data.error || 'Hujjatdan ma\'lumot olib bo\'lmadi');
        return;
      }

      const filledCount = Object.values(data.fields).filter(
        (v) => v !== undefined && v !== null && v !== '',
      ).length;
      const confidence = data.confidence ? ` · ${Math.round(data.confidence * 100)}%` : '';
      toast.success(`${filledCount} ta maydon to'ldirildi${confidence}`, {
        description: `${Math.round((Date.now() - t0) / 100) / 10} soniya`,
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      });

      onExtracted(data.fields as T, data.confidence);
    } catch (err) {
      toast.error('Tarmoq xatosi', { icon: <AlertCircle className="h-4 w-4 text-red-500" /> });
      console.error('[OcrScanButton]', err);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={`inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-60 ${className}`}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ScanLine className="h-4 w-4" />
        )}
        {busy ? 'Tahlil qilinmoqda…' : label || `${KIND_LABEL[kind]} skanlash`}
      </button>
    </>
  );
}
