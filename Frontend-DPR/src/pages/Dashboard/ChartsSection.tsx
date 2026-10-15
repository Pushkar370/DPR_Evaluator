import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { Bar, Doughnut } from 'react-chartjs-2';

interface ChartsSectionProps {
  barChartData: any;
  doughnutData: any;
}

/**
 * Dashboard Charts Section Component
 * Displays application trends and risk distribution charts
 */
export const ChartsSection: React.FC<ChartsSectionProps> = ({ barChartData, doughnutData }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={8}>
        <Card sx={{ height: '100%', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)', borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#0f2c59' }}>
              Application Trends (6 Months)
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar
                data={barChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' as const } }
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)', borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#0f2c59' }}>
              Risk Distribution
            </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' as const } }
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
