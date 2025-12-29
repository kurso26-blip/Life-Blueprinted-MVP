
import React, { useMemo, useState } from 'react';
import { format, addMonths, eachMonthOfInterval, differenceInDays } from 'date-fns';
import { UserTimelineInstance, UserTask } from '../types';
import { storage } from '../services/storage';
import { Calendar as CalendarIcon, Info, Clock, CheckCircle2, Check } from 'lucide-react';

interface ProjectVisualCalendarProps {
  timelines: UserTimelineInstance[];
}

const COLORS = [
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
];

const PIXELS_PER_DAY = 22;

const startOfDayLocal = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};

const ProjectVisualCalendar: React.FC<ProjectVisualCalendarProps> = ({ timelines }) => {
  const [hoveredTask, setHoveredTask] = useState<{ task: UserTask; timelineTitle: string; color: string } | null>(null);

  const { months, totalDays, startDate } = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const end = addMonths(today, 18);
    return {
      startDate: today,
      months: eachMonthOfInterval({ start: today, end }),
      totalDays: differenceInDays(end, today)
    };
  }, []);

  const timelineData = useMemo(() => {
    return timelines.map((tl, index) => {
      const allTasks = storage.getTasks(tl.instance_id);
      const calendarTasks = allTasks
        .filter(t => t.computed_due_date)
        .map(t => ({
          ...t,
          normalizedDate: startOfDayLocal(t.computed_due_date!)
        }));

      return {
        ...tl,
        color: COLORS[index % COLORS.length],
        tasks: calendarTasks
      };
    });
  }, [timelines]);

  if (timelines.length === 0) return null;

  return (
    <div className="mb-12 bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0f172a] rounded-xl flex items-center justify-center text-[#06b6d4]">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#0f172a] tracking-tight">Master Build Schedule</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Global Timeline Outlook</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {timelineData.map(tl => (
            <div key={tl.instance_id} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tl.color }} />
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight">{tl.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-4">
        {hoveredTask && (
          <div className="fixed z-[100] bg-[#0f172a] text-white p-4 rounded-2xl shadow-2xl w-64 border border-white/10 pointer-events-none transform -translate-x-1/2 -translate-y-[calc(100%+20px)]"
               style={{ top: '50%', left: '50%' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredTask.color }} />
              <span className="text-[9px] font-black text-[#06b6d4] uppercase tracking-widest">{hoveredTask.timelineTitle}</span>
            </div>
            <h4 className="text-sm font-black mb-1">{hoveredTask.task.title}</h4>
            <div className="flex items-center justify-between mt-2">
               <span className="text-[10px] font-black text-slate-400 uppercase">{hoveredTask.task.computed_due_date}</span>
               {hoveredTask.task.is_completed && <CheckCircle2 size={12} className="text-[#10b981]" />}
            </div>
          </div>
        )}

        <div className="overflow-x-auto no-scrollbar border border-slate-50 rounded-3xl bg-slate-50/50">
          <div className="relative pt-12 pb-8 px-4" style={{ width: `${totalDays * PIXELS_PER_DAY}px` }}>
            <div className="absolute top-0 left-0 right-0 flex h-full pointer-events-none">
              {months.map((m, i) => {
                const dayOffset = differenceInDays(m, startDate);
                return (
                  <div key={i} className="absolute top-0 h-full border-l border-slate-100" style={{ left: `${dayOffset * PIXELS_PER_DAY}px` }}>
                    <span className="absolute top-4 left-3 text-[9px] font-black text-slate-300 uppercase tracking-widest">{format(m, 'MMM yyyy')}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-6 pt-4">
              {timelineData.map((tl) => (
                <div key={tl.instance_id} className="relative h-12 flex items-center group">
                  <div className="absolute inset-x-0 h-px bg-slate-100 group-hover:bg-[#06b6d4]/20 transition-all" />
                  {tl.tasks.map((task) => {
                    const dayOffset = differenceInDays(task.normalizedDate, startDate);
                    if (dayOffset < -10 || dayOffset > totalDays) return null;

                    const sameDayTasks = tl.tasks.filter(ot => ot.computed_due_date === task.computed_due_date);
                    const myIndexInDay = sameDayTasks.findIndex(ot => ot.user_task_id === task.user_task_id);
                    const vOffset = sameDayTasks.length > 1 ? (myIndexInDay - (sameDayTasks.length - 1) / 2) * 14 : 0;

                    return (
                      <div
                        key={task.user_task_id}
                        onMouseEnter={() => setHoveredTask({ task, timelineTitle: tl.title, color: tl.color })}
                        onMouseLeave={() => setHoveredTask(null)}
                        className={`absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm cursor-pointer transition-all hover:scale-150 hover:z-50 ${task.is_completed ? 'opacity-50' : 'opacity-100'}`}
                        style={{ 
                          left: `${dayOffset * PIXELS_PER_DAY}px`, 
                          top: `calc(50% + ${vOffset}px)`,
                          backgroundColor: tl.color,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        {task.is_completed && <Check size={8} className="text-white absolute inset-0 m-auto" strokeWidth={4} />}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="absolute top-0 bottom-0 w-px bg-red-400 z-10 pointer-events-none" style={{ left: '0px' }}>
              <div className="bg-red-400 text-white text-[8px] font-black px-1 rounded absolute -top-1 left-0 -translate-x-1/2 uppercase">Today</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-slate-400 text-[10px] italic">
        <Info size={12} className="text-[#06b6d4]" /> Points represent all blueprint components and milestones. Staggered points indicate same-day activities.
      </div>
    </div>
  );
};

export default ProjectVisualCalendar;
