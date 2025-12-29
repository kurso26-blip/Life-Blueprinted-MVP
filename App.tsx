
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import YearAtAGlance from './components/YearAtAGlance';
import { api } from './services/api';
import { storage } from './services/storage';
import { Blueprint, Timeline, TaskList, Task, UserTimelineInstance, UserTask, AnchorMode, KnowledgeBase } from './types';
import { 
  ChevronRight, 
  Calendar, 
  ArrowLeft, 
  Trash2,
  Check,
  Zap,
  PlusCircle,
  Loader2,
  Download,
  Upload,
  RotateCcw,
  X,
  ShieldCheck
} from 'lucide-react';
import { format, addDays, isPast } from 'date-fns';

type Page = 'library' | 'blueprint-select' | 'initialize' | 'generating' | 'dashboard' | 'instance' | 'info';

const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <circle cx="15" cy="15" r="10" /><circle cx="32.5" cy="15" r="4" /><circle cx="50" cy="15" r="7.5" /><circle cx="67.5" cy="15" r="4" /><circle cx="85" cy="15" r="10" />
    <circle cx="15" cy="32.5" r="4" /><circle cx="32.5" cy="32.5" r="7.5" /><circle cx="50" cy="32.5" r="4" /><circle cx="67.5" cy="32.5" r="7.5" /><circle cx="85" cy="32.5" r="4" />
    <circle cx="15" cy="50" r="7.5" /><circle cx="32.5" cy="50" r="4" /><circle cx="50" cy="50" r="12" /><circle cx="67.5" cy="50" r="4" /><circle cx="85" cy="50" r="7.5" />
    <circle cx="15" cy="67.5" r="4" /><circle cx="32.5" cy="67.5" r="7.5" /><circle cx="50" cy="67.5" r="4" /><circle cx="67.5" cy="67.5" r="7.5" /><circle cx="85" cy="67.5" r="4" />
    <circle cx="15" cy="85" r="10" /><circle cx="32.5" cy="85" r="4" /><circle cx="50" cy="85" r="7.5" /><circle cx="67.5" cy="85" r="4" /><circle cx="85" cy="85" r="10" />
  </svg>
);

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeBlueprint, setActiveBlueprint] = useState<Blueprint | null>(null);
  const [activeTimelineTemplate, setActiveTimelineTemplate] = useState<{ timeline: Timeline; tasklists: TaskList[]; tasks: Task[] } | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [goalDate, setGoalDate] = useState<string>(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [activeInstance, setActiveInstance] = useState<UserTimelineInstance | null>(null);
  const [instanceTasks, setInstanceTasks] = useState<UserTask[]>([]);

  const [moduleSelections, setModuleSelections] = useState<Record<string, string[]>>({});
  const [customModuleItems, setCustomModuleItems] = useState<Record<string, string[]>>({});
  const [customInputText, setCustomInputText] = useState<Record<string, string>>({});

  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [userTimelines, setUserTimelines] = useState<UserTimelineInstance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLibrary();
    setUserTimelines(storage.getTimelines());
  }, []);

  useEffect(() => {
    if (activeInstance) {
      setInstanceTasks(storage.getTasks(activeInstance.instance_id));
    } else {
      setInstanceTasks([]);
    }
  }, [activeInstance]);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const data = await api.getBlueprints();
      setBlueprints(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const labelMap: Record<string, string> = {
    'Months_Tasks': 'Month Ahead',
    'Weeks_Tasks': 'Weeks Ahead',
    'Days_Tasks': 'Days Ahead',
    'Dayof_Tasks': 'Day of',
    'After_Tasks': 'Afterwards'
  };

  const getModuleOffset = (key: string) => {
    const k = key.toLowerCase().trim();
    if (k.includes('month')) return -30;
    if (k.includes('week')) return -7;
    if (k.includes('dayof') || k === 'day of') return 0;
    if (k.includes('day')) return -1;
    if (k.includes('after')) return 2;
    return 0;
  };

  const resetSurveyState = () => {
    setModuleSelections({});
    setCustomModuleItems({});
    setCustomInputText({});
  };

  const handleExportData = () => {
    const data = {
      timelines: storage.getTimelines(),
      tasks: storage.getTasks()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `life-blueprinted-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.timelines && data.tasks) {
          storage.saveTimelines(data.timelines);
          storage.saveTasks(data.tasks);
          setUserTimelines(storage.getTimelines());
          alert('Data integrity restored successfully.');
        }
      } catch (err) {
        alert('Structural mismatch. Import failed.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetApp = () => {
    if (confirm('DANGER: This will permanently wipe all local blueprints. Proceed?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleCategoryClick = async (bp: Blueprint) => {
    setLoading(true);
    setActiveBlueprint(bp);
    try {
      const data = await api.getTimelines(bp.blueprint_id);
      setTimelines(data);
      setCurrentPage('blueprint-select');
    } catch (err) {
      console.error('Failed to load timelines:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInstanceNotes = (notes: string) => {
    if (!activeInstance) return;
    const updatedInstance = { ...activeInstance, notes };
    setActiveInstance(updatedInstance);
    const updatedTimelines = userTimelines.map(tl => 
      tl.instance_id === activeInstance.instance_id ? updatedInstance : tl
    );
    setUserTimelines(updatedTimelines);
    storage.saveTimelines(updatedTimelines);
  };

  const handleTimelineClick = async (tl: Timeline) => {
    setLoading(true);
    resetSurveyState(); 
    try {
      const data = await api.getTimelineDetail(tl.timeline_id);
      setActiveTimelineTemplate(data);
      setSelectedTaskIds(new Set(data.tasks.map(t => t.task_id)));
      setCurrentPage('initialize'); 
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const taskListModules = useMemo(() => {
    if (!activeTimelineTemplate) return [];
    const { tasklists } = activeTimelineTemplate;
    if (tasklists.length === 0) return [];
    const standardKeys = ['tasklist_id', 'timeline_id', 'title', 'description', 'sort_order', 'status'];
    const allKeys = Object.keys(tasklists[0]);
    const moduleKeys = allKeys.filter(k => !standardKeys.includes(k));
    return moduleKeys.map(key => {
      const allItems = tasklists.flatMap(tl => {
        const val = tl[key];
        if (typeof val === 'string' && val.trim() !== '') {
          return val.split(',').map(s => s.trim()).filter(s => s !== '');
        }
        return [];
      });
      const options = Array.from(new Set(allItems));
      return { key, label: labelMap[key] || key, options };
    }).filter(m => m.options.length > 0);
  }, [activeTimelineTemplate]);

  const generateFinalTimeline = () => {
    if (!activeTimelineTemplate) return;
    setCurrentPage('generating');
    setTimeout(() => {
      const { timeline, tasks } = activeTimelineTemplate;
      const instanceId = crypto.randomUUID();
      const [year, month, day] = goalDate.split('-').map(Number);
      const baseGoalDate = new Date(year, month - 1, day);
      const filteredTasks = tasks.filter(t => selectedTaskIds.has(t.task_id));
      const userTasks: UserTask[] = filteredTasks.map(t => {
        let computedDate: string | null = null;
        const offset = Number(t.offset_days || 0);
        const anchor = t.anchor_type || timeline.default_anchor_mode;
        if (anchor === AnchorMode.END_DATE || anchor === AnchorMode.EVENT_DATE) {
          computedDate = format(addDays(baseGoalDate, -offset), 'yyyy-MM-dd');
        } else {
          computedDate = format(addDays(baseGoalDate, offset), 'yyyy-MM-dd');
        }
        return {
          user_task_id: crypto.randomUUID(),
          instance_id: instanceId,
          template_task_id: t.task_id,
          title: t.title,
          details: t.details,
          computed_due_date: computedDate,
          priority: t.priority,
          is_completed: false,
          is_skipped: false,
          notes: '',
          section_label: t.section_label,
          sort_order: t.sort_order
        };
      });
      
      Object.keys(moduleSelections).forEach((moduleName) => {
        const selections = moduleSelections[moduleName];
        const offset = getModuleOffset(moduleName);
        selections.forEach((sel, idx) => {
          userTasks.push({
            user_task_id: crypto.randomUUID(),
            instance_id: instanceId,
            template_task_id: `module-${moduleName}-${idx}`,
            title: sel,
            details: `Selection from ${labelMap[moduleName] || moduleName}`,
            computed_due_date: format(addDays(baseGoalDate, offset), 'yyyy-MM-dd'),
            priority: 'medium',
            is_completed: false,
            is_skipped: false,
            notes: '',
            section_label: labelMap[moduleName] || moduleName,
            sort_order: 999
          });
        });
      });

      Object.keys(customModuleItems).forEach((moduleName) => {
        const items = customModuleItems[moduleName];
        const offset = getModuleOffset(moduleName);
        items.forEach((item, idx) => {
          userTasks.push({
            user_task_id: crypto.randomUUID(),
            instance_id: instanceId,
            template_task_id: `custom-${moduleName}-${idx}`,
            title: item,
            details: `User added component in ${labelMap[moduleName] || moduleName}`,
            computed_due_date: format(addDays(baseGoalDate, offset), 'yyyy-MM-dd'),
            priority: 'medium',
            is_completed: false,
            is_skipped: false,
            notes: '',
            section_label: labelMap[moduleName] || moduleName,
            sort_order: 1000
          });
        });
      });

      const newInstance: UserTimelineInstance = {
        instance_id: instanceId,
        timeline_id: timeline.timeline_id,
        title: timeline.title,
        dates: { end_date: goalDate, custom_anchors: {} },
        created_at: new Date().toISOString(),
        progress: 0,
        notes: ''
      };
      
      const updatedTimelines = [...userTimelines, newInstance];
      setUserTimelines(updatedTimelines);
      storage.saveTimelines(updatedTimelines);
      storage.saveTasks(userTasks);
      setActiveInstance(newInstance);
      resetSurveyState(); 
      setCurrentPage('instance');
    }, 2000);
  };

  const handleToggleModuleItem = (moduleKey: string, option: string) => {
    const current = moduleSelections[moduleKey] || [];
    const next = current.includes(option) ? current.filter(o => o !== option) : [...current, option];
    setModuleSelections({ ...moduleSelections, [moduleKey]: next });
  };

  const handleAddCustomItem = (moduleKey: string) => {
    const text = customInputText[moduleKey];
    if (!text || !text.trim()) return;
    const current = customModuleItems[moduleKey] || [];
    setCustomModuleItems({ ...customModuleItems, [moduleKey]: [...current, text.trim()] });
    setCustomInputText({ ...customInputText, [moduleKey]: '' });
  };

  const handleToggleTaskProgress = (taskId: string, field: 'is_completed' | 'is_skipped') => {
    const task = instanceTasks.find(t => t.user_task_id === taskId);
    if (!task) return;
    const updates: Partial<UserTask> = { [field]: !task[field] };
    if (field === 'is_completed' && updates[field]) updates.is_skipped = false;
    if (field === 'is_skipped' && updates[field]) updates.is_completed = false;
    storage.updateTask(taskId, updates);
    setInstanceTasks(prev => prev.map(t => t.user_task_id === taskId ? { ...t, ...updates } : t));
    
    if (activeInstance) {
      const updatedTasks = storage.getTasks(activeInstance.instance_id);
      const progress = Math.round((updatedTasks.filter(t => t.is_completed || t.is_skipped).length / updatedTasks.length) * 100);
      const updatedTimelines = userTimelines.map(tl => tl.instance_id === activeInstance.instance_id ? { ...tl, progress } : tl);
      setUserTimelines(updatedTimelines);
      storage.saveTimelines(updatedTimelines);
    }
  };

  const deleteTimeline = (id: string) => {
    storage.deleteTimeline(id);
    setUserTimelines(storage.getTimelines());
    setCurrentPage('dashboard');
  };

  const handleRemoveCustomItem = (moduleKey: string, index: number) => {
    const current = customModuleItems[moduleKey] || [];
    const next = [...current];
    next.splice(index, 1);
    setCustomModuleItems({ ...customModuleItems, [moduleKey]: next });
  };

  const wizardSteps = [
    { id: 'library', label: 'Archive' },
    { id: 'blueprint-select', label: 'Selection' },
    { id: 'initialize', label: 'Survey' },
  ];
  const currentStepIndex = wizardSteps.findIndex(s => s.id === currentPage);

  return (
    <Layout activeTab={currentPage === 'dashboard' || currentPage === 'instance' ? 'dashboard' : currentPage === 'info' ? 'info' : 'library'} onNavigate={setCurrentPage}>
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[100] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-[#06b6d4] animate-spin" />
            <p className="font-black text-[#0f172a] text-xs uppercase tracking-widest italic">Recalibrating Framework...</p>
          </div>
        </div>
      )}

      {currentStepIndex !== -1 && (
        <div className="max-w-6xl mx-auto mb-8 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-8">
            {wizardSteps.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${idx <= currentStepIndex ? 'bg-[#06b6d4] text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {idx < currentStepIndex ? <Check size={12} /> : idx + 1}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${idx === currentStepIndex ? 'text-[#06b6d4]' : 'text-slate-300'}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentPage === 'dashboard' && (
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-3xl font-black text-[#0f172a]">Active Construction</h1>
              <p className="text-slate-500 text-sm font-medium italic">Your precision-engineered life timelines.</p>
            </div>
            <button onClick={() => setCurrentPage('library')} className="bg-[#0f172a] text-white px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg"><Zap size={18} className="text-[#06b6d4]" /> New Blueprint</button>
          </div>

          <YearAtAGlance timelines={userTimelines} />

          {userTimelines.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-100 rounded-[2rem] p-16 text-center">
              <Logo className="w-16 h-16 text-slate-200 mx-auto mb-6" />
              <h2 className="text-xl font-black">Archive Empty</h2>
              <p className="text-slate-400 text-sm mb-8">Initialize a blueprint to begin planning.</p>
              <button onClick={() => setCurrentPage('library')} className="bg-[#06b6d4] text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs">Browse Archive</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                {userTimelines.map(instance => (
                  <div key={instance.instance_id} className="bg-white border border-slate-100 rounded-[2rem] p-8 hover:shadow-xl transition-all cursor-pointer group" onClick={() => { setActiveInstance(instance); setCurrentPage('instance'); }}>
                    <div className="flex justify-between mb-6">
                      <span className="px-3 py-1 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-[#06b6d4] rounded-full border border-slate-100">{instance.progress}% Stable</span>
                      <button onClick={(e) => { e.stopPropagation(); deleteTimeline(instance.instance_id); }} className="text-slate-200 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                    <h3 className="text-xl font-black group-hover:text-[#06b6d4] mb-2">{instance.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6"><Calendar size={12} className="text-[#06b6d4]" /> {instance.dates.end_date}</div>
                    <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-[#06b6d4] transition-all" style={{ width: `${instance.progress}%` }} /></div>
                  </div>
                ))}
              </div>

              {/* Data Integrity Section */}
              <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-[#0f172a] rounded-xl flex items-center justify-center text-[#06b6d4]">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#0f172a]">System Integrity</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Local Data Maintenance</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button onClick={handleExportData} className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col items-center gap-3 group hover:border-[#06b6d4] transition-all">
                    <Download className="text-slate-300 group-hover:text-[#06b6d4]" size={24} />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-600">Export Backup</span>
                    <p className="text-[10px] text-slate-400 font-medium text-center">Save your timelines to a local JSON file.</p>
                  </button>

                  <button onClick={() => fileInputRef.current?.click()} className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col items-center gap-3 group hover:border-[#06b6d4] transition-all">
                    <Upload className="text-slate-300 group-hover:text-[#06b6d4]" size={24} />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-600">Restore Archive</span>
                    <p className="text-[10px] text-slate-400 font-medium text-center">Import a previously saved blueprint backup.</p>
                    <input type="file" ref={fileInputRef} onChange={handleImportData} className="hidden" accept=".json" />
                  </button>

                  <button onClick={handleResetApp} className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col items-center gap-3 group hover:border-red-200 transition-all">
                    <RotateCcw className="text-slate-300 group-hover:text-red-500" size={24} />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-600">Reset System</span>
                    <p className="text-[10px] text-slate-400 font-medium text-center">Danger: Wipe all local data and restart.</p>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {currentPage === 'library' && (
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-black mb-10">Blueprint Domains</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blueprints.map(bp => (
              <div key={bp.blueprint_id} onClick={() => handleCategoryClick(bp)} className="bg-white border border-slate-100 rounded-[2.5rem] p-10 hover:shadow-2xl cursor-pointer group transition-all text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-[#06b6d4] mb-6 group-hover:bg-[#06b6d4] group-hover:text-white transition-all"><Logo className="w-8 h-8" /></div>
                <h3 className="text-xl font-black mb-2">{bp.name}</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">{bp.description}</p>
                <div className="mt-auto pt-6 text-[10px] font-black text-[#06b6d4] uppercase tracking-widest">Select Domain <ChevronRight size={14} className="inline ml-1" /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentPage === 'blueprint-select' && (
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setCurrentPage('library')} className="text-[10px] font-black text-slate-300 hover:text-[#0f172a] uppercase tracking-widest mb-8 flex items-center gap-2"><ArrowLeft size={14} /> Back to Library</button>
          <h1 className="text-3xl font-black mb-10">{activeBlueprint?.name} Projects</h1>
          <div className="space-y-4">
            {timelines.map(tl => (
              <div key={tl.timeline_id} onClick={() => handleTimelineClick(tl)} className="bg-white border border-slate-100 rounded-2xl p-8 flex items-center justify-between hover:shadow-lg cursor-pointer group">
                <div>
                  <h3 className="text-lg font-black mb-1">{tl.title}</h3>
                  <p className="text-slate-400 text-sm">{tl.summary}</p>
                </div>
                <ChevronRight className="text-slate-200 group-hover:text-[#06b6d4]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {currentPage === 'initialize' && activeTimelineTemplate && (
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-black text-center mb-12">Project Survey</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-xl">
              <h3 className="text-xs font-black text-[#06b6d4] uppercase tracking-widest mb-6">Site Anchor</h3>
              <input type="date" value={goalDate} onChange={(e) => setGoalDate(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-6 text-2xl font-black text-center focus:ring-4 focus:ring-[#06b6d4]/10 outline-none" />
              <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                {['Months_Tasks', 'Weeks_Tasks', 'Days_Tasks', 'After_Tasks'].map(k => (
                  <div key={k} className="flex items-center gap-3 text-[11px] font-black text-slate-500 uppercase tracking-tight">
                    <div className="w-2 h-2 rounded-full bg-[#06b6d4]" /> {labelMap[k] || k}: <span className="text-[#06b6d4] ml-auto">
                      {format(addDays(new Date(goalDate.replace(/-/g, '/')), getModuleOffset(k)), 'MMM d, yyyy')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xs font-black text-[#06b6d4] uppercase tracking-widest">Component Selection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {taskListModules.map(module => (
                  <div key={module.key} className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col shadow-sm">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4">{module.label}</h4>
                    <div className="flex-1 space-y-2 overflow-y-auto max-h-32 no-scrollbar mb-4">
                      {module.options.map(opt => (
                        <div key={opt} onClick={() => handleToggleModuleItem(module.key, opt)} className="flex items-center gap-2 cursor-pointer group">
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${moduleSelections[module.key]?.includes(opt) ? 'bg-[#06b6d4] border-[#06b6d4] text-white' : 'border-slate-200 group-hover:border-[#06b6d4]'}`}>{moduleSelections[module.key]?.includes(opt) && <Check size={8} strokeWidth={4} />}</div>
                          <span className={`text-[10px] font-bold ${moduleSelections[module.key]?.includes(opt) ? 'text-[#0f172a]' : 'text-slate-300'}`}>{opt}</span>
                        </div>
                      ))}
                      {customModuleItems[module.key]?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between group">
                          <div className="flex items-center gap-2">
                             <div className="w-3.5 h-3.5 rounded border bg-[#06b6d4] border-[#06b6d4] text-white flex items-center justify-center"><Check size={8} strokeWidth={4} /></div>
                             <span className="text-[10px] font-bold text-[#0f172a]">{item}</span>
                          </div>
                          <button onClick={() => handleRemoveCustomItem(module.key, idx)} className="text-red-400 opacity-0 group-hover:opacity-100"><X size={10} /></button>
                        </div>
                      ))}
                    </div>
                    <div className="relative pt-2 border-t border-slate-50 flex items-center gap-2">
                      <input type="text" placeholder="Custom..." value={customInputText[module.key] || ''} onChange={(e) => setCustomInputText({...customInputText, [module.key]: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleAddCustomItem(module.key)} className="flex-1 bg-slate-50 border border-slate-100 rounded-lg py-2 px-3 text-[10px] font-bold outline-none" />
                      <button onClick={() => handleAddCustomItem(module.key)} className="text-[#06b6d4]"><PlusCircle size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <button onClick={() => setCurrentPage('blueprint-select')} className="px-8 py-4 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-300 hover:text-[#0f172a]">Cancel</button>
            <button onClick={generateFinalTimeline} className="px-10 py-4 bg-[#0f172a] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 flex items-center gap-2 hover:opacity-95">Build Final Plan <ChevronRight size={14} /></button>
          </div>
        </div>
      )}

      {currentPage === 'generating' && (
        <div className="fixed inset-0 bg-[#0f172a] z-[200] flex items-center justify-center">
          <div className="text-center">
             <div className="w-24 h-24 border-[6px] border-white/5 border-t-[#06b6d4] rounded-full animate-spin mx-auto mb-10" />
             <h1 className="text-2xl font-black text-white mb-2">Rendering Architecture...</h1>
             <p className="text-slate-500 text-sm font-medium italic">Establishing structural integrity.</p>
          </div>
        </div>
      )}

      {currentPage === 'instance' && activeInstance && (
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <button onClick={() => setCurrentPage('dashboard')} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-[#0f172a] uppercase tracking-widest mb-6"><ArrowLeft size={14} /> Active Projects</button>
              <h1 className="text-4xl font-black tracking-tight">{activeInstance.title}</h1>
              <div className="flex items-center gap-4 mt-6">
                 <div className="bg-[#0f172a] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Calendar size={12} className="text-[#06b6d4]" /> Goal: {activeInstance.dates.end_date}</div>
                 <div className="bg-slate-50 border border-slate-100 text-[#06b6d4] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">{activeInstance.progress}% Built</div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-12">
               {[{l:'Immediate', c:'text-red-500', f: (t:UserTask) => !t.is_completed && !t.is_skipped && t.computed_due_date && isPast(new Date(t.computed_due_date.replace(/-/g,'/')))}, {l:'Active', c:'text-[#06b6d4]', f:(t:UserTask) => !t.is_completed && !t.is_skipped && (!t.computed_due_date || !isPast(new Date(t.computed_due_date.replace(/-/g,'/'))))}, {l:'Resolved', c:'text-slate-300', f:(t:UserTask) => t.is_completed || t.is_skipped}].map(g => {
                 const tasks = instanceTasks.filter(g.f);
                 if (tasks.length === 0) return null;
                 return (
                   <div key={g.l}>
                     <h3 className={`text-[10px] font-black uppercase tracking-widest mb-8 flex items-center gap-4 ${g.c}`}>{g.l} <div className="flex-1 h-px bg-slate-50" /> <span>{tasks.length}</span></h3>
                     <div className="space-y-4">
                       {tasks.map(t => (
                         <div key={t.user_task_id} className={`bg-white border border-slate-100 rounded-2xl p-6 flex items-start gap-4 transition-all ${t.is_completed ? 'opacity-50' : 'hover:shadow-md'}`}>
                           <button onClick={() => handleToggleTaskProgress(t.user_task_id, 'is_completed')} className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${t.is_completed ? 'bg-[#06b6d4] border-[#06b6d4] text-white' : 'bg-slate-50 border-slate-100'}`}><Check size={16} strokeWidth={4} /></button>
                           <div className="flex-1">
                             <div className="flex justify-between mb-1">
                               <h4 className={`font-black text-sm ${t.is_completed ? 'line-through' : ''}`}>{t.title}</h4>
                               <span className="text-[10px] font-black text-slate-300 uppercase">{t.computed_due_date}</span>
                             </div>
                             <p className="text-slate-400 text-xs font-medium">{t.details}</p>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 );
               })}
            </div>
            
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Project Log</h3>
                <textarea value={activeInstance.notes || ''} onChange={(e) => handleUpdateInstanceNotes(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-medium min-h-[150px] outline-none" placeholder="Structural observations..." />
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
