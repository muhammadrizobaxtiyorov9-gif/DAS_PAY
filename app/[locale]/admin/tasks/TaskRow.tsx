'use client';

import { useState } from 'react';
import { Trash2, Loader2, Calendar } from 'lucide-react';
import { updateTaskStatus, deleteTask } from '@/app/actions/admin';

export function TaskRow({ task }: { task: any }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const statusColors: any = {
    pending: 'border-yellow-200 text-yellow-700 bg-yellow-50',
    in_progress: 'border-blue-200 text-blue-700 bg-blue-50',
    completed: 'border-emerald-200 text-emerald-700 bg-emerald-50',
    overdue: 'border-red-200 text-red-700 bg-red-50'
  };

  const priorityColors: any = {
    low: 'text-gray-500 bg-gray-100',
    medium: 'text-blue-500 bg-blue-100',
    high: 'text-orange-500 bg-orange-100',
    urgent: 'text-red-500 bg-red-100 font-bold'
  };

  const deadline = new Date(task.deadline).toLocaleDateString('ru-RU', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'completed';

  async function handleStatus(e: React.ChangeEvent<HTMLSelectElement>) {
    setIsUpdating(true);
    await updateTaskStatus(task.id, e.target.value);
    setIsUpdating(false);
  }

  async function handleDelete() {
    if (!confirm('Ushbu topshiriqni o`chirmokchimisiz?')) return;
    setIsDeleting(true);
    await deleteTask(task.id);
  }

  return (
    <tr className={`hover:bg-gray-50/50 transition-colors ${isDeleting ? 'opacity-50' : ''}`}>
      <td className="px-6 py-4">
        <div className="font-bold text-[#042C53] max-w-[250px] truncate" title={task.title}>{task.title}</div>
        {task.description && <div className="text-xs text-gray-500 max-w-[250px] truncate mt-1" title={task.description}>{task.description}</div>}
      </td>
      <td className="px-6 py-4">
        {task.lead ? (
          <div className="text-xs">
             <span className="font-semibold text-gray-700">{task.lead.name}</span>
             <br/>
             <span className="text-gray-400">{task.lead.service || 'Ariza'}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Bog'lanmagan</span>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-800">{task.assignedTo.name || task.assignedTo.username}</div>
        <div className="text-[10px] text-gray-400">Yubordi: {task.assignedBy.name || task.assignedBy.username}</div>
      </td>
      <td className="px-6 py-4">
        <div className={`flex items-center gap-1.5 text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
           <Calendar className="w-4 h-4" />
           {deadline}
        </div>
      </td>
      <td className="px-6 py-4">
        <select
          value={isOverdue ? 'overdue' : task.status}
          onChange={handleStatus}
          disabled={isUpdating || isDeleting || isOverdue && task.status !== 'completed'}
          className={`text-xs font-semibold rounded-full px-3 py-1.5 border appearance-none outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer pr-6 ${statusColors[isOverdue && task.status !== 'completed' ? 'overdue' : task.status] || statusColors.pending}`}
        >
          <option value="pending">Kutilmoqda</option>
          <option value="in_progress">Jarayonda</option>
          <option value="completed">Bajarildi</option>
          {isOverdue && <option value="overdue">Muddati o'tgan</option>}
        </select>
      </td>
      <td className="px-6 py-4">
         <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${priorityColors[task.priority]}`}>
            {task.priority}
         </span>
      </td>
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
