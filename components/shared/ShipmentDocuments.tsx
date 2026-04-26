'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Upload,
  Trash2,
  FileText,
  ImageIcon,
  Loader2,
  Camera,
  Download,
} from 'lucide-react';

export interface ShipmentDoc {
  id: number;
  kind: string;
  url: string;
  mimeType: string;
  size: number;
  originalName: string;
  caption: string | null;
  source: string;
  createdAt: string;
}

interface Props {
  shipmentId: number;
  /** Allow user to delete their uploads */
  canDelete?: boolean;
  /** Pre-select kind (e.g. 'photo' for the driver) */
  defaultKind?: 'photo' | 'cmr' | 'tir' | 'ttn' | 'invoice' | 'other';
  /** Heading label */
  title?: string;
  /** Use camera capture on mobile */
  cameraCapture?: boolean;
}

const KIND_LABEL: Record<string, string> = {
  photo: 'Rasm',
  cmr: 'CMR',
  tir: 'TIR',
  ttn: 'TTN',
  invoice: 'Hisob-faktura',
  other: 'Boshqa',
};

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ShipmentDocuments({
  shipmentId,
  canDelete = true,
  defaultKind = 'photo',
  title = 'Hujjatlar va rasmlar',
  cameraCapture = false,
}: Props) {
  const [docs, setDocs] = useState<ShipmentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [kind, setKind] = useState<string>(defaultKind);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/documents`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipmentId]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('kind', kind);
        const res = await fetch(`/api/shipments/${shipmentId}/documents`, {
          method: 'POST',
          body: fd,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(`Yuklashda xato: ${err.error || res.status}`);
        } else {
          toast.success(`${file.name} yuklandi`);
        }
      }
      await load();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (docId: number) => {
    if (!confirm("Hujjatni o'chirishni tasdiqlang?")) return;
    const res = await fetch(`/api/shipments/${shipmentId}/documents?docId=${docId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setDocs((d) => d.filter((x) => x.id !== docId));
      toast.success("O'chirildi");
    } else {
      toast.error("O'chirib bo'lmadi");
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {docs.length}
          </span>
        </div>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 outline-none focus:border-blue-400"
        >
          {Object.entries(KIND_LABEL).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </header>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
        multiple
        capture={cameraCapture ? 'environment' : undefined}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…
          </>
        ) : (
          <>
            {cameraCapture ? <Camera className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            Fayl yoki rasm yuklash ({KIND_LABEL[kind]})
          </>
        )}
      </button>

      <div className="mt-4 space-y-2">
        {loading && <div className="text-center text-xs text-slate-400">Yuklanmoqda…</div>}
        {!loading && docs.length === 0 && (
          <div className="rounded-lg bg-slate-50 px-3 py-6 text-center text-xs text-slate-400">
            Hozircha hujjat yuklanmagan
          </div>
        )}

        {docs.map((doc) => {
          const isImage = doc.mimeType.startsWith('image/');
          return (
            <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-2">
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="block">
                {isImage ? (
                  <img
                    src={doc.url}
                    alt={doc.originalName}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-slate-400">
                    <FileText className="h-5 w-5" />
                  </div>
                )}
              </a>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-600">
                    {KIND_LABEL[doc.kind] || doc.kind}
                  </span>
                  <span className="truncate text-xs font-medium text-slate-700">
                    {doc.originalName}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  {fmtSize(doc.size)} · {new Date(doc.createdAt).toLocaleString('uz-UZ')} · {doc.source}
                </div>
              </div>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                title="Ochish / Yuklab olish"
              >
                {isImage ? <ImageIcon className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              </a>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  title="O'chirish"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
