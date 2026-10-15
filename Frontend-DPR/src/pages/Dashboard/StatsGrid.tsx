import React from 'react';
import { Grid } from '@mui/material';
import { StatCard } from '../../components';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SyncIcon from '@mui/icons-material/Sync';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import { formatValue } from '../../utils';
import { DashboardStats } from '../../constants/mockData';

interface StatsGridProps {
  stats: DashboardStats;
}

/**
 * Dashboard Statistics Grid Component
 * Displays key metrics in card format
 */
export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          title="Total Documents"
          value={formatValue(stats.totalDocuments)}
          subtitle="Uploads this month"
          icon={<DescriptionIcon fontSize="medium" />}
          color="#1976D2"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          title="Completed Analysis"
          value={formatValue(stats.completedAnalysis)}
          subtitle="98% Success Rate"
          icon={<CheckCircleIcon fontSize="medium" />}
          color="#2E7D32"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          title="Processing"
          value={formatValue(stats.processing)}
          subtitle="Queue Load: Low"
          icon={<SyncIcon fontSize="medium" />}
          color="#0288D1"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          title="Average Score"
          value={formatValue(stats.averageScore, '%')}
          subtitle="Quality Index"
          icon={<AnalyticsIcon fontSize="medium" />}
          color="#7B1FA2"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          title="Feasibility Rating"
          value={formatValue(stats.feasibilityRating, '%')}
          subtitle="AI Prediction"
          icon={<TrendingUpIcon fontSize="medium" />}
          color="#00796B"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          title="Risk Level"
          value={stats.riskLevel}
          subtitle="Overall Project Risk"
          icon={<WarningIcon fontSize="medium" />}
          color="#ED6C02"
        />
      </Grid>
    </Grid>
  );
};
