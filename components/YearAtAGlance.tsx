
import React, { useMemo } from 'react';
import { format, addMonths } from 'date-fns';
import { UserTimelineInstance, UserTask } from '../types';
import { storage } from '../services/storage';
import { CalendarDays } from 'lucide-react';

interface YearAtAGlanceProps {
  timelines: UserTimelineInstance[];
}

const COLORS = [
  '#0f172a', // Navy Blue
  '#f59e0b', // Gold (Amber)
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#ec4899', // Pink
];

const YearAtAGlance: React.FC<YearAtAGlanceProps> = ({ timelines }) => {
  const months = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return Array.from({ length: 12 }, (_, i) => addMonths(start, i));
  }, []);

  const tasksByMonth = useMemo(() => {
    // Collect all tasks from all timelines and map with their timeline's designated color
    const allTimelineTasks: (UserTask & { color: string })[] = timelines.flatMap((tl, index) => {
      // Correctly fetch tasks for each specific timeline instance
      const tasks = storage.getTasks(tl.instance_id);
      return tasks
        .filter(t => t.computed_due_date && !t.is_skipped)
        .map(t => ({
          ...t,
          color: COLORS[index % COLORS.length]
        }));
    });

    // Group tasks into their respective months based on their INDIVIDUAL computed_due_date
    return months.map(month => {
      const monthYear = month.getFullYear();
      const monthIndex = month.getMonth();
      
      const monthTasks = allTimelineTasks.filter(t => {
        if (!t.computed_due_date) return false;
        // Parsing "YYYY-MM-DD" safely
        const [y, m, d] = t.computed_due_date.split('-').map(Number);
        const taskDate = new Date(y, m - 1, d);
        return taskDate.getFullYear() === monthYear && taskDate.getMonth() === monthIndex;
      });

      // Sort tasks within the month by day
      monthTasks.sort((a, b) => (a.computed_due_date || '').localeCompare(b.computed_due_date || ''));

      return {
        month,
        tasks: monthTasks
      };
    });
  }, [timelines, months]);

  if (timelines.length === 0) return null;

  return (
    <div className="mb-12 bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm overflow-hidden flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#06b6d4] rounded-2xl flex items-center justify-center text-[#0f172a] shadow-lg shadow-[#06b6d4]/20">
          <CalendarDays size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#0f172a] tracking-tight leading-none mb-1">Year at a Glance</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Comprehensive Activity Forecast</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10">
        {tasksByMonth.map(({ month, tasks }, idx) => (
          <div key={idx} className={`flex flex-col gap-3 ${tasks.length === 0 ? 'opacity-30' : ''}`}>
            <div className="flex items-center justify-between border-b-2 border-slate-50 pb-2">
              <h3 className="text-[11px] font-black text-[#0f172a] uppercase tracking-widest">
                {format(month, 'MMMM yyyy')}
              </h3>
              <span className="text-[9px] font-black text-slate-300 bg-slate-50 px-2 py-0.5 rounded-full">
                {tasks.length}
              </span>
            </div>
            
            <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
              {tasks.length > 0 ? (
                tasks.map(task => {
                  const [y, m, d] = task.computed_due_date!.split('-').map(Number);
                  const dateStr = `${m}/${d}`;
                  return (
                    <div key={task.user_task_id} className="flex gap-2 items-baseline leading-snug group cursor-default">
                      <span className="text-[10px] font-black text-slate-400 shrink-0 tabular-nums w-7">
                        {dateStr}
                      </span>
                      <span 
                        className={`text-[11px] font-bold transition-all group-hover:underline ${task.is_completed ? 'line-through opacity-40' : ''}`}
                        style={{ color: task.is_completed ? 'inherit' : task.color }}
                      >
                        {task.title}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-[9px] font-bold text-slate-200 uppercase tracking-widest py-1">Idle</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default YearAtAGlance;
