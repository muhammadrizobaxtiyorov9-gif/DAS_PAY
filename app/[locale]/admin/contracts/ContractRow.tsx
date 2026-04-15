'use client';

import { useState } from 'react';
import { Trash2, Download, Loader2 } from 'lucide-react';
import { deleteContract } from '@/app/actions/admin';

export function ContractRow({ contract }: { contract: any }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDelete() {
    if (!confirm('Haqiqatan ham ushbu shartnomani arxivdan o`chirmokchimisiz?')) return;
    setIsDeleting(true);
    await deleteContract(contract.id);
  }

  async function handleDownload() {
    setIsDownloading(true);
    try {
      // Fetch document from Next.js API using Contract Data reconstructed
      const res = await fetch('/api/contracts/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractNumber: contract.contractNumber,
          contractDate: contract.contractDate,
          data: {
            companyName: contract.companyName,
            companyDirector: contract.companyDirector,
            companyAddress: contract.companyAddress,
            companyInn: contract.companyInn,
            companyBank: contract.companyBank,
            bankMfo: contract.bankMfo,
            bankInn: contract.bankInn,
            bankNum: contract.bankNum,
            bankCurrency: contract.bankCurrency,
            hasCorrespondent: contract.hasCorrespondent,
            bankCorrName: contract.bankCorrName,
            bankCorrAddress: contract.bankCorrAddress,
            bankCorrSwift: contract.bankCorrSwift
          }
        })
      });

      if (!res.ok) throw new Error('Yuklashda xatolik yuz berdi');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Shartnoma_Mijoz_${contract.contractNumber}_DasPay.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <tr className={`hover:bg-gray-50/50 transition-colors ${isDeleting ? 'opacity-50' : ''}`}>
      <td className="px-6 py-4 font-mono font-medium text-blue-600">
        № {contract.contractNumber}
      </td>
      <td className="px-6 py-4 font-medium max-w-sm truncate">
        {contract.companyName}
        <div className="text-xs text-gray-500 font-normal">Rahbar: {contract.companyDirector}</div>
      </td>
      <td className="px-6 py-4">
        {contract.companyInn}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {contract.contractDate}
      </td>
      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
        <button 
          onClick={handleDownload}
          disabled={isDownloading}
          className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors flex items-center gap-1"
          title="Word formatida yuklab olish"
        >
          {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        </button>

        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors inline-block"
          title="O'chirish"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </td>
    </tr>
  );
}
