import { User } from '../types/user';

/**
 * Mock Data for Development & Testing
 */

// Mock User Profiles
export const MOCK_USERS: Record<'admin' | 'author' | 'public', User> = {
  admin: {
    name: 'Amit Kumar',
    role: 'Senior Project Officer',
    roleType: 'admin',
    department: 'Public Works Department (PWD)',
    email: 'amit.kumar@gov.in',
    phone: '+91 98765 43210',
    location: 'New Delhi, India',
    joinDate: '15 Aug 2021',
    employeeId: 'GOV-ADM-2021-458',
  },
  author: {
    name: 'Rajesh Verma',
    role: 'DPR Author',
    roleType: 'author',
    department: 'Urban Development Ministry',
    email: 'rajesh.verma@gov.in',
    phone: '+91 98123 45678',
    location: 'Mumbai, India',
    joinDate: '22 Jan 2023',
    employeeId: 'GOV-DPR-2023-112',
  },
  public: {
    name: 'Priya Sharma',
    role: 'Public User',
    roleType: 'public',
    department: 'Citizen',
    email: 'priya.sharma@email.com',
    phone: '+91 99999 88888',
    location: 'Bangalore, India',
    joinDate: '30 Jan 2024',
    employeeId: 'PUB-USR-2024-001',
  },
};

// Mock Login Credentials (for demo purposes only)
export const MOCK_CREDENTIALS = {
  admin: { username: 'admin', password: 'admin' },
  author: { username: 'author', password: 'author' },
  public: { username: 'public', password: 'public' },
} as const;

// Mock Recent Activity Data
export interface ActivityItem {
  id: number;
  name: string;
  date: string;
  status: 'Completed' | 'Processing' | 'Review Needed' | 'Failed';
  score: number | null;
}

export const MOCK_RECENT_ACTIVITY: ActivityItem[] = [
  { id: 1, name: 'Road_Project_Assam_Phase1.pdf', date: '2023-10-25', status: 'Completed', score: 88 },
  { id: 2, name: 'Water_Supply_Manipur.docx', date: '2023-10-24', status: 'Processing', score: null },
  { id: 3, name: 'Bridge_Construct_Nagaland.pdf', date: '2023-10-24', status: 'Review Needed', score: 45 },
  { id: 4, name: 'Solar_Grid_Tripura.pdf', date: '2023-10-23', status: 'Completed', score: 92 },
  { id: 5, name: 'Urban_Housing_Mizoram.docx', date: '2023-10-22', status: 'Failed', score: 0 },
];

// Mock Dashboard Stats
export interface DashboardStats {
  totalDocuments: number;
  completedAnalysis: number;
  processing: number;
  averageScore: number;
  feasibilityRating: number;
  riskLevel: string;
}

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalDocuments: 24,
  completedAnalysis: 18,
  processing: 4,
  averageScore: 78,
  feasibilityRating: 85,
  riskLevel: 'Low',
};

// Mock Chart Data
export const MOCK_BAR_CHART_DATA = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'DPRs Uploaded',
      data: [12, 19, 3, 5, 2, 3],
      backgroundColor: '#0f2c59',
    },
    {
      label: 'Analysis Completed',
      data: [10, 15, 2, 4, 2, 2],
      backgroundColor: '#ff9933',
    },
  ],
};

export const MOCK_DOUGHNUT_DATA = {
  labels: ['High Risk', 'Medium Risk', 'Low Risk'],
  datasets: [
    {
      data: [2, 5, 17],
      backgroundColor: ['#d32f2f', '#ed6c02', '#2e7d32'],
      borderWidth: 1,
    },
  ],
};
