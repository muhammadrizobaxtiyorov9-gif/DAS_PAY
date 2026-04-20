import { prisma } from '@/lib/prisma';
import { ClipboardList } from 'lucide-react';
import { TaskRow } from './TaskRow';
import { TaskFormModal } from './TaskFormModal';
import { getAdminSession } from '@/lib/adminAuth';

export const revalidate = 0;

export default async function AdminTasksPage() {
  const session = await getAdminSession();
  const currentUserId = session?.userId ?? 0;

  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      assignedTo: { select: { id: true, name: true, username: true } },
      assignedBy: { select: { id: true, name: true, username: true } },
      lead: { select: { id: true, name: true, service: true, status: true } }
    }
  });

  const staff = await prisma.user.findMany({
    select: { id: true, name: true, username: true }
  });

  const leads = await prisma.lead.findMany({
    where: { status: { not: 'finished' } },
    select: { id: true, name: true, service: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">
          <ClipboardList className="h-6 w-6"/> Topshiriqlar Boshqaruvi
        </h1>
        <TaskFormModal staff={staff} leads={leads} currentUserId={currentUserId} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900">Topshiriq nomi</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Bog&apos;langan Ariza</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Mas&apos;ul (Kimga)</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Muddat</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Holati</th>
                <th className="px-6 py-4 font-semibold text-gray-900">Muhimligi</th>
                <th className="px-6 py-4 font-semibold text-gray-900 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tasks.length === 0 ? (
                <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Hozircha hech qanday topshiriq qo&apos;shilmagan.
                   </td>
                </tr>
              ) : tasks.map(task => (
                <TaskRow key={task.id} task={task} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
