export type Severity = 'Low' | 'Medium' | 'High';
export type Category = 'IT' | 'Network' | 'Security' | 'Hardware' | 'Software' | 'Other';
export type Status = 'Open' | 'Investigating' | 'Resolved' | 'Closed';

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: Category;
  status: Status;
  priority_score: number;
  suggested_order: number;
  copilot_summary?: string;
  copilot_steps?: string;
  copilot_recommendations?: string;
  created_at: string;
}

export interface AIRating {
  priorityScore: number;
  suggestedOrder: number;
  category: Category;
}

export interface CopilotOutput {
  summary: string;
  steps: string[];
  recommendations: string[];
}
