'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { updateLeadStatus, deleteLead } from '@/app/actions/admin';

export function LeadRow({ lead, staff = [] }: { lead: any; staff?: any[] }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const statusColors: any = {
    new: 'border-blue-200 text-blue-700 bg-blue-50',
    contacted: 'border-amber-200 text-amber-700 bg-amber-50',
    finished: 'border-emerald-200 text-emerald-700 bg-emerald-50'
  };

  const dt = new Date(lead.createdAt).toLocaleString('ru-RU', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  async function handleStatus(e: React.ChangeEvent<HTMLSelectElement>) {
    setIsUpdating(true);
    await updateLeadStatus(lead.id, e.target.value, lead.assignedToId);
    setIsUpdating(false);
  }

  async function handleAssignee(e: React.ChangeEvent<HTMLSelectElement>) {
    setIsUpdating(true);
    const assigneeId = e.target.value ? parseInt(e.target.value) : undefined;
    await updateLeadStatus(lead.id, lead.status, assigneeId);
    setIsUpdating(false);
  }

  async function handleDelete() {
    if (!confirm('Haqiqatan ham ushbu arizani o`chirmokchimisiz?')) return;
    setIsDeleting(true);
    await deleteLead(lead.id);
  }

  return (
    <tr className={`hover:bg-gray-50/50 transition-colors ${isDeleting ? 'opacity-50' : ''}`}>
      <td className="px-6 py-4">
        <div className="font-medium text-gray-900">{lead.name}</div>
        <div className="text-xs text-gray-500">{lead.email || 'Email yo\'q'}</div>
      </td>
      <td className="px-6 py-4 font-mono text-gray-700">{lead.phone}</td>
      <td className="px-6 py-4">
        <div>
           <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-800 font-bold">
             {lead.transportType ? lead.transportType.toUpperCase() : (lead.service || 'Boshqa')}
           </span>
           {lead.fromStation && lead.toStation && (
             <div className="mt-2 text-xs font-semibold text-[#042C53] bg-blue-50 rounded px-2 py-1 inline-block border border-blue-100">
               {lead.fromStation} ➞ {lead.toStation}
             </div>
           )}
           <div className="text-xs text-gray-500 mt-1 max-w-[200px] truncate" title={lead.message}>
             {lead.message}
           </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="relative">
          <select
            value={lead.status}
            onChange={handleStatus}
            disabled={isUpdating || isDeleting}
            className={`text-xs font-semibold rounded-full px-3 py-1.5 border appearance-none outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer pr-6 ${statusColors[lead.status] || statusColors.new}`}
          >
            <option value="new">Yangi</option>
            <option value="contacted">Bog'lanildi</option>
            <option value="finished">Tugatildi</option>
          </select>
        </div>
      </td>
      <td className="px-6 py-4">
         <select
            value={lead.assignedToId || ""}
            onChange={handleAssignee}
            disabled={isUpdating || isDeleting}
            className="text-xs max-w-[120px] bg-gray-50 rounded px-2 py-1.5 border appearance-none outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
         >
            <option value="">(Biriktirilmagan)</option>
            {staff.map(u => (
               <option key={u.id} value={u.id}>{u.name || u.username}</option>
            ))}
         </select>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">{dt}</td>
      <td className="px-6 py-4 text-right">
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
