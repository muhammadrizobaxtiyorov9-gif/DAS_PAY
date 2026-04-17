'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function CalendarView({ tasks }: { tasks: any[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Create an array of days for the current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Make Monday 0
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const weekDays = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];
  
  const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

  // Helper to get tasks for a specific date
  const getTasksForDate = (day: number) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.deadline);
      return taskDate.getDate() === day && taskDate.getMonth() === month && taskDate.getFullYear() === year;
    });
  };

  const statusIcons: any = {
    pending: <Clock className="w-3 h-3 text-yellow-500" />,
    in_progress: <Clock className="w-3 h-3 text-blue-500" />,
    completed: <CheckCircle2 className="w-3 h-3 text-emerald-500" />,
    overdue: <AlertCircle className="w-3 h-3 text-red-500" />
  };

  return (
    <div className="flex flex-col h-[700px]">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
         <h2 className="text-xl font-bold text-[#042C53] flex items-center gap-3">
            {monthNames[month]} {year}
            <span className="bg-blue-100 text-[#185FA5] text-xs font-bold px-2 py-1 rounded-full">
               {tasks.filter(t => new Date(t.deadline).getMonth() === month && new Date(t.deadline).getFullYear() === year).length} ta topshiriq
            </span>
         </h2>
         <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 bg-gray-50 border rounded-lg hover:bg-gray-100 transition-colors">
               <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={nextMonth} className="p-2 bg-gray-50 border rounded-lg hover:bg-gray-100 transition-colors">
               <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
         </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 border-b bg-gray-50/50">
         {weekDays.map(day => (
            <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500 border-r last:border-r-0">
               {day}
            </div>
         ))}
      </div>

      {/* Grid */ }
      <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-gray-50 overflow-hidden">
         {/* Empty cells before month starts */}
         {Array.from({ length: adjustedFirstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-gray-50/30 border-r border-b p-2" />
         ))}

         {/* Days */}
         {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayTasks = getTasksForDate(day);
            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

            return (
               <div key={day} className={`bg-white border-r border-b p-2 overflow-y-auto hover:bg-blue-50/20 transition-colors cursor-pointer group ${isToday ? 'bg-blue-50/40 ring-1 ring-[#185FA5] ring-inset' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                     <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-[#185FA5] text-white' : 'text-gray-500 group-hover:text-[#185FA5]'}`}>
                        {day}
                     </span>
                     {dayTasks.length > 0 && <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 rounded">{dayTasks.length} ta</span>}
                  </div>
                  
                  <div className="space-y-1.5">
                     {dayTasks.map(task => (
                        <div key={task.id} className="text-xs bg-gray-50 border p-1.5 rounded flex items-start gap-1 hover:border-[#185FA5] transition-colors" title={task.title}>
                           {statusIcons[task.status] || statusIcons.pending}
                           <div className="flex-1 truncate font-medium text-gray-700">
                              {task.title}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            );
         })}
         
         {/* Fill remaining cells */}
         {Array.from({ length: 35 - (adjustedFirstDay + daysInMonth) > 0 ? 35 - (adjustedFirstDay + daysInMonth) : 42 - (adjustedFirstDay + daysInMonth) }).map((_, i) => (
            <div key={`end-empty-${i}`} className="bg-gray-50/30 border-r border-b p-2" />
         ))}
      </div>
    </div>
  );
}
