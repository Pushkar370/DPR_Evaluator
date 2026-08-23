import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { MOCK_DASHBOARD_STATS, MOCK_RECENT_ACTIVITY, MOCK_BAR_CHART_DATA, MOCK_DOUGHNUT_DATA } from '../../constants';
import { StatsGrid, ChartsSection, RecentActivityTable } from './';

// Chart.js Imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Register ChartJS Components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

/**
 * Main Dashboard Component
 * Displays overview of DPR Quality Assessment System
 */
const Dashboard: React.FC = () => {
  const [stats, setStats] = useState(MOCK_DASHBOARD_STATS);
  const [barChartData, setBarChartData] = useState(MOCK_BAR_CHART_DATA);
  const [doughnutData, setDoughnutData] = useState(MOCK_DOUGHNUT_DATA);
  const [recentActivity, setRecentActivity] = useState(MOCK_RECENT_ACTIVITY);

  useEffect(() => {
    const fetchLatestJob = async () => {
      const jobId = localStorage.getItem('dpr_job_id');
      if (!jobId) return;
      try {
        const response = await fetch(`http://localhost:8000/status/${jobId}`);
        const data = await response.json();
        if (data && data.status === 'COMPLETED' && data.report) {
           setStats(prev => ({
              ...prev,
              totalDocuments: 25,
              completedAnalysis: 19,
           }));
           
           const newActivity = {
             id: Date.now(),
             name: 'Analyzed_DPR_Project.pdf',
             date: new Date().toISOString().split('T')[0],
             status: 'Completed' as const,
             score: 95
           };
           setRecentActivity([newActivity, ...MOCK_RECENT_ACTIVITY.slice(0, 4)]);

           const newBarData = JSON.parse(JSON.stringify(MOCK_BAR_CHART_DATA));
           newBarData.datasets[0].data[5] += 1;
           newBarData.datasets[1].data[5] += 1;
           setBarChartData(newBarData);

           const risksCount = data.report.evaluation_summary?.flagged_risks?.length || 0;
           const newDoughnut = JSON.parse(JSON.stringify(MOCK_DOUGHNUT_DATA));
           if (risksCount > 5) {
               newDoughnut.datasets[0].data[0] += 1; // High risk
           } else if (risksCount > 2) {
               newDoughnut.datasets[0].data[1] += 1; // Medium
           } else {
               newDoughnut.datasets[0].data[2] += 1; // Low
           }
           setDoughnutData(newDoughnut);
        }
      } catch (e) {
        console.error("Failed to fetch jobs graph update", e);
      }
    };
    fetchLatestJob();
  }, []);

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f2c59', mb: 1 }}>
          Dashboard Overview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time insights and analytics for DPR Quality Assessment
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <StatsGrid stats={stats} />

      {/* Charts Section */}
      <ChartsSection barChartData={barChartData} doughnutData={doughnutData} />

      {/* Recent Activity Table */}
      <RecentActivityTable activities={recentActivity} />
    </Box>
  );
};

export default Dashboard;
