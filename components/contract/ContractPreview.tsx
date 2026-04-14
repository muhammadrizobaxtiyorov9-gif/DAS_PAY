'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Plus,
  CheckCircle2,
  Building2,
  Landmark,
  Globe2,
  Printer,
} from 'lucide-react';
import type { ContractFormData } from './ContractForm';

// ─── Russian month names ──────────────────────────────────────────────────────
const RU_MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

function formatDateRu(dateStr: string): string {
  // dateStr comes from backend as ISO or "14 апреля 2026г"
  if (dateStr.includes(' ')) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `«${d.getDate()}» ${RU_MONTHS[d.getMonth()]} ${d.getFullYear()}г.`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContractPreviewProps {
  contractNumber: number;
  contractDate: string;
  data: ContractFormData;
  onNew: () => void;
}

// ─── Full Contract Text Component ─────────────────────────────────────────────

// We no longer need the hardcoded `ContractDocument` because we will fetch the live HTML.

// ─── Main Preview Component ───────────────────────────────────────────────────

export function ContractPreview({
  contractNumber,
  contractDate,
  data,
  onNew,
}: ContractPreviewProps) {
  const [previewHtml, setPreviewHtml] = React.useState<string>('Генерация предпросмотра...');

  React.useEffect(() => {
    const fetchPreview = async () => {
      try {
        const res = await fetch('/api/contracts/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contractNumber, contractDate, data }),
        });
        if (res.ok) {
          const { html } = await res.json();
          setPreviewHtml(html);
        } else {
          setPreviewHtml('<p class="text-red-500">Ошибка при генерации предпросмотра.</p>');
        }
      } catch (err) {
        setPreviewHtml('<p class="text-red-500">Ошибка соединения.</p>');
      }
    };
    fetchPreview();
  }, [contractNumber, contractDate, data]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      const res = await fetch('/api/contracts/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractNumber, contractDate, data }),
      });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Договор_№${contractNumber}_DasPay.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Не удалось скачать файл. Используйте кнопку печати.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* ── Success banner ── */}
      <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-6 py-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500 shadow-md">
          <CheckCircle2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="font-semibold text-green-800">Договор успешно создан!</p>
          <p className="text-sm text-green-600">
            Присвоен номер <span className="font-bold">№&nbsp;{contractNumber}</span> от{' '}
            {formatDateRu(contractDate)}
          </p>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 rounded-xl bg-[#042C53] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#185FA5] transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Download className="h-4 w-4" />
          Скачать DOCX
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-xl border-2 border-[#042C53] px-5 py-2.5 text-sm font-semibold text-[#042C53] hover:bg-[#042C53] hover:text-white transition-all"
        >
          <Printer className="h-4 w-4" />
          Распечатать
        </button>
        <button
          onClick={onNew}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all ml-auto"
        >
          <Plus className="h-4 w-4" />
          Новый договор
        </button>
      </div>

      {/* ── Document preview ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-3">
          <FileText className="h-5 w-5 text-[#042C53]" />
          <span className="text-sm font-semibold text-[#042C53]">
            Договор № {contractNumber} — Предварительный просмотр
          </span>
        </div>
        <div
          id="contract-document"
          className="p-8 md:p-12 max-h-[70vh] overflow-y-auto contract-doc-rendered"
          style={{ fontFamily: 'Times New Roman, Times, serif', fontSize: '13pt', lineHeight: '1.6' }}
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>

      {/* ── Print styles ── */}
      <style jsx global>{`
        .contract-doc-rendered p {
           margin-bottom: 0.75rem;
           text-align: justify;
        }
        .contract-doc-rendered strong {
           font-weight: bold;
        }
        @media print {
          body > *:not(#print-area) { display: none !important; }
          #contract-document {
            display: block !important;
            padding: 20mm;
            font-size: 12pt;
            font-family: 'Times New Roman', serif;
            color: black;
            max-height: none !important;
            overflow: visible !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
