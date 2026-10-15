/**
 * API Service Layer for DPR Compliance & Multi-Agent Evaluation System
 * ====================================================================
 * Connects Frontend-DPR to the FastAPI LangGraph Backend.
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // 3 minutes for deep multi-agent analysis
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface FindingItem {
  pillar: string;
  category: 'Strength' | 'Risk' | 'Deficiency' | 'Compliance Gap' | string;
  description: string;
  dpr_page: number;
  guideline_reference?: string | null;
  severity: 'Low' | 'Medium' | 'High' | 'Critical' | string;
}

export interface ConflictItem {
  title: string;
  pillars_involved: string[];
  description: string;
  resolution: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical' | string;
}

export interface PillarScorecard {
  pillar: 'Technical' | 'Financial' | 'Administrative' | 'Social' | string;
  score: number;
  weight: number;
  summary: string;
  guidelines_status: string;
  metrics: Record<string, any>;
  findings: FindingItem[];
}

export interface KeyProjectMetric {
  label: string;
  main_value: string;
  sub_details?: string[];
}

export interface EvaluationSummary {
  project_name?: string;
  approval_status?: 'Approve' | 'Revise' | 'Reject' | 'Pending Review' | string;
  overall_score?: number | null;
  pillar_scores?: Record<string, number>;
  slec_recommendation?: string;
  key_project_metrics: KeyProjectMetric[];
  flagged_risks: string[];
  missing_sections: string[];
  recommendations: string[];
}

export interface DynamicInsight {
  topic: string;
  details: string;
  risks: string[];
  extracted_values: Record<string, any>;
}

export interface AnalysisReport {
  job_id: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | string;
  overall_score?: number | null;
  verdict?: 'Approve' | 'Revise' | 'Reject' | string | null;
  executive_summary: string;
  evaluation_summary?: EvaluationSummary | null;
  pillar_scorecards: PillarScorecard[];
  conflicts: ConflictItem[];
  insights: DynamicInsight[];
  extracted_images?: Array<{ path: string; caption: string }>;
  error_message?: string | null;
  processing_time?: number | null;
  current_step?: string | null;
}

export interface HistoryItem {
  job_id: string;
  filename: string;
  status: string;
  overall_score?: number | null;
  verdict?: string | null;
  processing_time?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const dprApi = {
  uploadDPR: async (file: File): Promise<{ job_id: string; message: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<{ job_id: string; message: string }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  checkStatus: async (jobId: string): Promise<{ job_id: string; status: string; current_step?: string; report?: AnalysisReport }> => {
    const res = await apiClient.get<{ job_id: string; status: string; current_step?: string; report?: AnalysisReport }>(`/status/${jobId}`);
    return res.data;
  },

  getReport: async (jobId: string): Promise<AnalysisReport> => {
    const res = await apiClient.get<AnalysisReport>(`/report/${jobId}`);
    return res.data;
  },

  getReportsHistory: async (limit = 50): Promise<HistoryItem[]> => {
    const res = await apiClient.get<{ jobs: HistoryItem[] }>(`/reports?limit=${limit}`);
    return res.data.jobs;
  },

  getPillarScorecards: async (jobId: string): Promise<PillarScorecard[]> => {
    const res = await apiClient.get<PillarScorecard[]>(`/report/${jobId}/pillars`);
    return res.data;
  },

  getConflicts: async (jobId: string): Promise<ConflictItem[]> => {
    const res = await apiClient.get<ConflictItem[]>(`/report/${jobId}/conflicts`);
    return res.data;
  },

  askChatbot: async (jobId: string, query: string): Promise<string> => {
    const res = await apiClient.post<{ answer: string }>('/chat', { job_id: jobId, query });
    return res.data.answer;
  },

  getGuidelinesStatus: async () => {
    const res = await apiClient.get('/guidelines/status');
    return res.data;
  },

  ingestGuidelines: async () => {
    const res = await apiClient.post('/guidelines/ingest');
    return res.data;
  },
};

export default dprApi;
