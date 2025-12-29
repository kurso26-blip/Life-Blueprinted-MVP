
import { Blueprint, Timeline, TaskList, Task, KnowledgeBase, Status, TimeHorizonType, AnchorMode } from '../types';

/**
 * Replace this with your actual Google Apps Script Web App URL.
 */
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbyFigycfDVXRUPthjGdshipxPTQYbk49yM2m_ybxPuoTwJE_H4GGonqc_ZigphnjVYMTA/exec'; 

export const api = {
  async getBlueprints(): Promise<Blueprint[]> {
    if (!API_BASE_URL) return MOCK_DATA.blueprints as Blueprint[];
    const res = await fetch(`${API_BASE_URL}?path=blueprints`);
    return res.json();
  },

  async getTimelines(blueprintId: string): Promise<Timeline[]> {
    if (!API_BASE_URL) return MOCK_DATA.timelines.filter(t => t.blueprint_id === blueprintId) as Timeline[];
    const res = await fetch(`${API_BASE_URL}?path=timelines&blueprint_id=${blueprintId}`);
    return res.json();
  },

  async getTimelineDetail(timelineId: string): Promise<{ timeline: Timeline; tasklists: TaskList[]; tasks: Task[] }> {
    if (!API_BASE_URL) {
      const timeline = MOCK_DATA.timelines.find(t => t.timeline_id === timelineId)! as Timeline;
      const tasklists = MOCK_DATA.tasklists.filter(tl => tl.timeline_id === timelineId) as TaskList[];
      const tlIds = tasklists.map(tl => tl.tasklist_id);
      const tasks = MOCK_DATA.tasks.filter(t => tlIds.includes(t.tasklist_id)) as unknown as Task[];
      return { timeline, tasklists, tasks };
    }
    const res = await fetch(`${API_BASE_URL}?path=timeline&timeline_id=${timelineId}`);
    return res.json();
  },

  async getKnowledgeBase(): Promise<KnowledgeBase> {
    if (!API_BASE_URL) return MOCK_DATA as unknown as KnowledgeBase;
    const res = await fetch(`${API_BASE_URL}?path=exportAll`);
    return res.json();
  },

  async syncTaskToCalendar(title: string, details: string, date: string): Promise<{ success: boolean; error?: string }> {
    if (!API_BASE_URL) {
      console.log('Mock: Synced to calendar', { title, details, date });
      return { success: true };
    }
    const params = new URLSearchParams({
      path: 'syncTask',
      title,
      details,
      date
    });
    const res = await fetch(`${API_BASE_URL}?${params.toString()}`);
    return res.json();
  }
};

// Robust mock data for development
const MOCK_DATA = {
  blueprints: [
    { blueprint_id: 'career', name: 'Career Mastery', description: 'Strategies for professional growth, job hunts, and skill acquisition.', icon: 'Briefcase', sort_order: 1, status: Status.ACTIVE },
    { blueprint_id: 'personal-finance', name: 'Wealth Builder', description: 'Financial independence blueprints including budgeting, debt payoff, and investing.', icon: 'DollarSign', sort_order: 2, status: Status.ACTIVE },
    { blueprint_id: 'home-life', name: 'Home & Relocation', description: 'Moving, home buying, and major renovation timelines.', icon: 'Home', sort_order: 3, status: Status.ACTIVE }
  ],
  timelines: [
    { 
      timeline_id: 'new-job-search', 
      blueprint_id: 'career', 
      title: 'Ultimate Job Hunt', 
      summary: 'A 12-week blueprint to land your next high-paying role.', 
      audience_tags: 'Career, Search, Tech', 
      time_horizon_type: TimeHorizonType.DATE_BASED, 
      default_anchor_mode: AnchorMode.START_DATE, 
      sort_order: 1, 
      status: Status.ACTIVE 
    },
    { 
      timeline_id: 'house-purchase', 
      blueprint_id: 'home-life', 
      title: 'Buying Your First Home', 
      summary: 'From pre-approval to closing day.', 
      audience_tags: 'Real Estate, Finance', 
      time_horizon_type: TimeHorizonType.DATE_BASED, 
      default_anchor_mode: AnchorMode.EVENT_DATE, 
      sort_order: 1, 
      status: Status.ACTIVE 
    }
  ],
  tasklists: [
    { tasklist_id: 'tl-1', timeline_id: 'new-job-search', title: 'Preparation Phase', description: 'Getting your assets ready.', sort_order: 1, status: Status.ACTIVE },
    { tasklist_id: 'tl-2', timeline_id: 'new-job-search', title: 'Outreach Phase', description: 'Applying and networking.', sort_order: 2, status: Status.ACTIVE }
  ],
  tasks: [
    { 
      task_id: 't-1', 
      tasklist_id: 'tl-1', 
      title: 'Update Resume', 
      details: 'Tailor your CV to your target roles.', 
      priority: 'high' as const, 
      task_type: 'action' as const, 
      is_optional: false, 
      dependencies: '', 
      anchor_type: AnchorMode.START_DATE, 
      offset_days: 2, 
      offset_label: 'Start + 2 days', 
      suggested_window_days: 3, 
      due_time_of_day: '10:00', 
      section_label: 'Week 1', 
      sort_order: 1, 
      status: Status.ACTIVE 
    },
    { 
      task_id: 't-2', 
      tasklist_id: 'tl-1', 
      title: 'Optimize LinkedIn', 
      details: 'Ensure profile matches resume.', 
      priority: 'medium' as const, 
      task_type: 'action' as const, 
      is_optional: false, 
      dependencies: 't-1', 
      anchor_type: AnchorMode.START_DATE, 
      offset_days: 4, 
      offset_label: 'Start + 4 days', 
      suggested_window_days: 2, 
      due_time_of_day: '12:00', 
      section_label: 'Week 1', 
      sort_order: 2, 
      status: Status.ACTIVE 
    }
  ]
};
