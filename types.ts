
export enum Status {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived'
}

export enum TimeHorizonType {
  DATE_BASED = 'date_based',
  MILESTONE_BASED = 'milestone_based',
  OPEN_ENDED = 'open_ended'
}

export enum AnchorMode {
  EVENT_DATE = 'event_date',
  START_DATE = 'start_date',
  END_DATE = 'end_date',
  CUSTOM_ANCHOR = 'custom_anchor'
}

export interface Blueprint {
  blueprint_id: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
  status: Status;
}

export interface Timeline {
  timeline_id: string;
  blueprint_id: string;
  title: string;
  summary: string;
  audience_tags: string; // comma separated
  time_horizon_type: TimeHorizonType;
  default_anchor_mode: AnchorMode;
  sort_order: number;
  status: Status;
}

export interface TaskList {
  tasklist_id: string;
  timeline_id: string;
  title: string;
  description: string;
  sort_order: number;
  status: Status;
  // Dynamic columns G-L will be indexed by their spreadsheet header names
  [key: string]: any;
}

export interface Task {
  task_id: string;
  tasklist_id: string;
  title: string;
  details: string;
  priority: 'low' | 'medium' | 'high';
  task_type: 'action' | 'decision' | 'research' | 'purchase' | 'message' | 'appointment';
  is_optional: boolean;
  dependencies: string; // comma separated
  anchor_type: AnchorMode;
  anchor_key?: string;
  offset_days: number;
  offset_label: string;
  suggested_window_days: number;
  due_time_of_day: string; // HH:MM
  section_label: string;
  sort_order: number;
  status: Status;
}

export interface UserTimelineInstance {
  instance_id: string;
  timeline_id: string;
  title: string;
  dates: {
    start_date?: string;
    end_date?: string;
    event_date?: string;
    custom_anchors: Record<string, string>;
  };
  created_at: string;
  progress: number;
  notes?: string;
}

export interface UserTask {
  user_task_id: string;
  instance_id: string;
  template_task_id: string;
  title: string;
  details: string;
  computed_due_date: string | null;
  priority: string;
  is_completed: boolean;
  is_skipped: boolean;
  notes: string;
  section_label: string;
  sort_order: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface KnowledgeBase {
  blueprints: Blueprint[];
  timelines: Timeline[];
  tasklists: TaskList[];
  tasks: Task[];
}
