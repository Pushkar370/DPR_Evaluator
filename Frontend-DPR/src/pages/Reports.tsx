import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Stack, Grid, Chip, CircularProgress, Alert
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';

import { dprApi, HistoryItem } from '../services/api';

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const history = await dprApi.getReportsHistory();
      setReports(history);
    } catch (err: any) {
      console.warn('Backend history fetch failed, checking localStorage fallback:', err);
      try {
        const saved = JSON.parse(localStorage.getItem('dpr_reports') || '[]');
        if (saved.length > 0) {
          setReports(saved.map((r: any) => ({
            job_id: r.job_id || 'LOCAL',
            filename: r.fileName || 'Uploaded DPR',
            status: r.status || 'COMPLETED',
            overall_score: r.overall_score || 75,
            verdict: r.verdict || 'Approve',
            created_at: r.date
          })));
        } else {
          setError('Failed to connect to backend server and no local cache was found.');
        }
      } catch (e) {
        setError('Failed to load evaluation history from backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleViewReport = async (jobId: string) => {
    try {
      const fullReport = await dprApi.getReport(jobId);
      navigate('/analysis', { state: { historicReport: fullReport } });
    } catch (err: any) {
      console.error('Failed to load full report:', err);
      // If it fails, check localStorage fallback
      const saved = JSON.parse(localStorage.getItem('dpr_reports') || '[]');
      const local = saved.find((r: any) => r.job_id === jobId);
      if (local) {
        navigate('/analysis', { state: { historicReport: local } });
      } else {
        alert('Could not fetch report details from backend.');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f2c59', mb: 1 }}>
            DPR Analysis Reports History
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Persistent archive of Detailed Project Reports evaluated via LangGraph Multi-Agent Assessment
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchReports}
          disabled={loading}
          sx={{ textTransform: 'none' }}
        >
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={50} />
          <Typography sx={{ mt: 2 }} color="text.secondary">Loading reports from SQLite backend...</Typography>
        </Box>
      ) : reports.length === 0 ? (
        <Card sx={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2, minHeight: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Stack spacing={2} alignItems="center">
              <DescriptionIcon sx={{ fontSize: 60, color: '#9e9e9e' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                No Reports in Database
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload a DPR document to run the multi-agent compliance evaluation.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/analysis')}
                sx={{ px: 4, py: 1, bgcolor: '#0f2c59', textTransform: 'none' }}
              >
                Go to Analysis Dashboard
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {reports.map((report, idx) => {
            const score = report.overall_score != null ? Math.round(report.overall_score) : null;
            const verdict = report.verdict || (score && score >= 75 ? 'Approve' : score && score >= 50 ? 'Revise' : 'Reject');
            const verdictColor = verdict === 'Approve' ? 'success' : verdict === 'Revise' ? 'warning' : 'error';

            return (
              <Grid item xs={12} md={6} lg={4} key={report.job_id || idx}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <AssessmentIcon sx={{ color: '#0f2c59', fontSize: 36 }} />
                      <Chip
                        label={report.status}
                        color={report.status === 'COMPLETED' ? 'success' : report.status === 'PROCESSING' ? 'primary' : 'error'}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#0f2c59' }} noWrap>
                      {report.filename}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      Job ID: {report.job_id} {report.created_at ? `• ${new Date(report.created_at).toLocaleDateString()}` : ''}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                      {score !== null && (
                        <Chip
                          label={`Score: ${score}/100`}
                          color={score >= 75 ? 'success' : score >= 50 ? 'warning' : 'error'}
                          sx={{ fontWeight: 'bold' }}
                        />
                      )}
                      {verdict && (
                        <Chip
                          label={verdict}
                          color={verdictColor}
                          variant="outlined"
                          sx={{ fontWeight: 'bold' }}
                        />
                      )}
                      {report.processing_time && (
                        <Chip
                          label={`${report.processing_time}s`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                  <Box sx={{ p: 2, mt: 'auto', borderTop: '1px solid #eee' }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => handleViewReport(report.job_id)}
                      disabled={report.status === 'PROCESSING'}
                      sx={{ textTransform: 'none', color: '#0f2c59', borderColor: '#0f2c59' }}
                    >
                      View Full Multi-Agent Evaluation
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default Reports;
