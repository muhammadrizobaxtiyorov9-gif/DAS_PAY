import { prisma } from '@/lib/prisma';
import { CalendarDays } from 'lucide-react';
import CalendarView from './CalendarView';

export const revalidate = 0;

export default async function AdminCalendarPage() {
  const tasks = await prisma.task.findMany({
    orderBy: { deadline: 'asc' },
    include: {
      assignedTo: { select: { id: true, name: true, username: true } },
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">
          <CalendarDays className="h-6 w-6"/> Xodimlar Topshiriqlari (Kalendar)
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
         <CalendarView tasks={tasks} />
      </div>
    </div>
  );
}
