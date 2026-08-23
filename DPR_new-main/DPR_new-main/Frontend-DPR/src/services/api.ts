/**
 * API Service Layer
 * ==================
 * Clean abstraction for backend communication
 * Handles all FastAPI endpoint calls
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance with defaults
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for heavy analysis operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================
// Type Definitions
// ============================================================

export type AnalysisStatus = 'pass' | 'fail' | 'warning' | 'pending';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// Compliance Types
export interface ComplianceItem {
  rule_id: string;
  rule_name: string;
  status: AnalysisStatus;
  requirement: string;
  finding: string;
  citation: string | null;
  section_reference: string | null;
}

export interface ComplianceResponse {
  section_name: string;
  overall_status: AnalysisStatus;
  compliance_score: number;
  checks_passed: number;
  checks_failed: number;
  items: ComplianceItem[];
  missing_requirements: string[];
  guideline_citations: string[];
  rag_explanation: string;
  processing_time_ms: number;
}

export interface ComplianceRequest {
  section_name: string;
  section_text: string;
  use_rag?: boolean;
}

// Feasibility Types
export interface FeasibilityMetric {
  metric_name: string;
  proposed_value: number;
  benchmark_value: number;
  deviation_percent: number;
  status: AnalysisStatus;
  explanation: string;
}

export interface FeasibilityResponse {
  overall_level: string;
  overall_score: number;
  cost_feasibility: FeasibilityMetric | null;
  timeline_feasibility: FeasibilityMetric | null;
  similar_projects_count: number;
  rag_reasoning: string;
  recommendations: string[];
  risk_factors: string[];
  processing_time_ms: number;
}

export interface FeasibilityRequest {
  project_description: string;
  proposed_cost_crore: number;
  proposed_duration_months: number;
  project_scope?: string;
  project_type?: string;
}

// Consistency Types
export interface InconsistencyItem {
  inconsistency_id: string;
  type: string;
  severity: RiskLevel;
  location_a: string;
  value_a: string;
  location_b: string;
  value_b: string;
  difference: number;
  difference_percent: number;
  rag_explanation: string;
  probable_cause: string;
  recommended_action: string;
}

export interface ConsistencyResponse {
  is_consistent: boolean;
  inconsistencies_found: number;
  items: InconsistencyItem[];
  processing_time_ms: number;
}

export interface ConsistencyRequest {
  sections: Record<string, string>;
}

// Risk Types
export interface RiskFactor {
  factor_id: string;
  factor_name: string;
  category: string;
  risk_level: RiskLevel;
  score: number;
  evidence: string[];
  mitigation_suggestion: string;
}

export interface RiskAssessmentResponse {
  overall_risk_score: number;
  overall_risk_level: RiskLevel;
  financial_score: number;
  timeline_score: number;
  technical_score: number;
  environmental_score: number;
  implementation_score: number;
  top_risks: string[];
  factors: RiskFactor[];
  rag_summary: string;
  recommendations: string[];
  historical_evidence: string[];
  processing_time_ms: number;
}

export interface RiskRequest {
  dpr_text: string;
  project_cost_crore?: number;
  project_duration_months?: number;
}

// Full Analysis Types
export interface FullAnalysisRequest {
  sections: Record<string, string>;
  project_description: string;
  proposed_cost_crore: number;
  proposed_duration_months: number;
  project_scope?: string;
  project_type?: string;
}

export interface FullAnalysisResponse {
  analysis_timestamp: string;
  overall_grade: string;
  overall_score: number;
  compliance: Record<string, ComplianceResponse> | null;
  feasibility: FeasibilityResponse | null;
  consistency: ConsistencyResponse | null;
  risk: RiskAssessmentResponse | null;
  executive_summary: string;
  processing_time_ms: number;
}

// Document Types
export interface DocumentUploadResponse {
  message: string;
  document_id: string;
  filename: string;
  chunks_created: number;
  processing_time_ms: number;
}

export interface SearchResult {
  chunk_id: string;
  content: string;
  section: string | null;
  similarity_score: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total_results: number;
}

// ============================================================
// API Functions
// ============================================================

/**
 * Analysis API
 */
export const analysisApi = {
  /**
   * Run compliance check on a DPR section
   */
  checkCompliance: async (request: ComplianceRequest): Promise<ComplianceResponse> => {
    const response = await apiClient.post<ComplianceResponse>('/analysis/compliance', request);
    return response.data;
  },

  /**
   * Analyze project feasibility
   */
  analyzeFeasibility: async (request: FeasibilityRequest): Promise<FeasibilityResponse> => {
    const response = await apiClient.post<FeasibilityResponse>('/analysis/feasibility', request);
    return response.data;
  },

  /**
   * Check document consistency
   */
  checkConsistency: async (request: ConsistencyRequest): Promise<ConsistencyResponse> => {
    const response = await apiClient.post<ConsistencyResponse>('/analysis/consistency', request);
    return response.data;
  },

  /**
   * Perform risk assessment
   */
  assessRisk: async (request: RiskRequest): Promise<RiskAssessmentResponse> => {
    const response = await apiClient.post<RiskAssessmentResponse>('/analysis/risk', request);
    return response.data;
  },

  /**
   * Run full DPR analysis
   */
  runFullAnalysis: async (request: FullAnalysisRequest): Promise<FullAnalysisResponse> => {
    const response = await apiClient.post<FullAnalysisResponse>('/analysis/full', request);
    return response.data;
  },
};

/**
 * Documents API
 */
export const documentsApi = {
  /**
   * Upload a DPR document
   */
  upload: async (file: File): Promise<DocumentUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<DocumentUploadResponse>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Search documents
   */
  search: async (query: string, topK = 10): Promise<SearchResponse> => {
    const response = await apiClient.post<SearchResponse>('/documents/search', { query, top_k: topK });
    return response.data;
  },

  /**
   * Get document statistics
   */
  getStats: async () => {
    const response = await apiClient.get('/documents/stats');
    return response.data;
  },

  /**
   * Delete a document
   */
  delete: async (documentId: string) => {
    const response = await apiClient.delete(`/documents/${documentId}`);
    return response.data;
  },
};

/**
 * Knowledge Base API
 */
export const knowledgeApi = {
  /**
   * Upload a guideline document
   */
  upload: async (file: File, category?: string): Promise<DocumentUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (category) formData.append('category', category);
    
    const response = await apiClient.post<DocumentUploadResponse>('/knowledge/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Ingest text content
   */
  ingestText: async (text: string, title?: string, category?: string) => {
    const response = await apiClient.post('/knowledge/ingest-text', {
      text,
      title,
      category,
    });
    return response.data;
  },

  /**
   * Search knowledge base
   */
  search: async (query: string, limit = 5, category?: string): Promise<SearchResponse> => {
    const response = await apiClient.post<SearchResponse>('/knowledge/search', {
      query,
      limit,
      category,
    });
    return response.data;
  },

  /**
   * Get knowledge base statistics
   */
  getStats: async () => {
    const response = await apiClient.get('/knowledge/stats');
    return response.data;
  },
};

export default apiClient;
