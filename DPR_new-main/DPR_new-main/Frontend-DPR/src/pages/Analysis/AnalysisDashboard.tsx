import React, { useState, useCallback, useEffect } from 'react';
import {
  Box, Container, Typography, Grid, Card, CardContent, Button, Alert, CircularProgress, Chip
} from '@mui/material';
import { CloudUpload as UploadIcon, Analytics as AnalyticsIcon } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useLocation, useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8000';

const buildReportQuality = (report: any) => {
  const insights = Array.isArray(report?.insights) ? report.insights : [];
  const evaluationSummary = report?.evaluation_summary;
  const extractedImages = Array.isArray(report?.extracted_images) ? report.extracted_images : [];

  const insightEvidenceCount = insights.filter((insight: any) => {
    const hasDetails = typeof insight?.details === 'string' && insight.details.trim().length > 0;
    const hasSupport = Boolean(insight?.extracted_values && Object.keys(insight.extracted_values).length > 0) || (Array.isArray(insight?.risks) && insight.risks.length > 0);
    return hasDetails && hasSupport;
  }).length;

  const evaluationPieces = [
    evaluationSummary?.flagged_risks?.length || 0,
    evaluationSummary?.missing_sections?.length || 0,
    evaluationSummary?.recommendations?.length || 0,
  ].reduce((total, value) => total + (value > 0 ? 1 : 0), 0);

  const evidenceSignals = [
    report?.executive_summary ? 1 : 0,
    insights.length > 0 ? 1 : 0,
    insightEvidenceCount > 0 ? 1 : 0,
    evaluationSummary ? 1 : 0,
    extractedImages.length > 0 ? 1 : 0,
  ];

  const score = Math.round((evidenceSignals.reduce((total, value) => total + value, 0) / evidenceSignals.length) * 100);

  return {
    score,
    insightCount: insights.length,
    insightEvidenceCount,
    evaluationPieces,
    extractedImagesCount: extractedImages.length,
    hasEvaluationSummary: Boolean(evaluationSummary),
    qualityLabel: score >= 80 ? 'Strong' : score >= 60 ? 'Moderate' : 'Review needed',
  };
};

export const AnalysisDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [activeStep, setActiveStep] = useState<'upload' | 'processing' | 'results'>('upload');
  const [jobId, setJobId] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const reportQuality = report ? buildReportQuality(report) : null;

  // Load a report passed from the Reports history page
  useEffect(() => {
    if (location.state && location.state.historicReport) {
      setReport(location.state.historicReport);
      setActiveStep('results');
      // Clear state so it doesn't get stuck if they press "Upload Another"
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1
  });

  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    setActiveStep('processing');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Failed to upload file');
      const uploadData = await uploadRes.json();
      setJobId(uploadData.job_id);

    } catch (err: any) {
      setError(err.message);
      setActiveStep('upload');
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeStep === 'processing' && jobId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/status/${jobId}`);
          if (!res.ok) throw new Error('Status polling failed');
          const data = await res.json();
          
          if (data.status === 'COMPLETED') {
            setReport(data.report);
            
            // Save to localStorage for Reports page
            try {
              const existingReports = JSON.parse(localStorage.getItem('dpr_reports') || '[]');
              const newReport = {
                ...data.report,
                fileName: file?.name || 'Uploaded Document',
                date: new Date().toISOString()
              };
              localStorage.setItem('dpr_reports', JSON.stringify([newReport, ...existingReports]));
            } catch (e) { console.error('Failed to save to local storage', e); }

            setActiveStep('results');
            clearInterval(interval);
          } else if (data.status === 'FAILED') {
            setError(data.report?.error_message || 'Analysis failed');
            setActiveStep('upload');
            clearInterval(interval);
          }
        } catch (err) {
          console.error(err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeStep, jobId]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AnalyticsIcon sx={{ fontSize: 40, color: '#0f2c59' }} />
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f2c59' }}>
            DPR Analysis Dashboard
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Upload and evaluate Detailed Project Reports through automated assessment
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {activeStep === 'upload' && (
        <Card sx={{ borderRadius: 3, maxWidth: 800, mx: 'auto' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Box
              {...getRootProps()}
              sx={{
                p: 6, border: '2px dashed #1976d2', borderRadius: 3,
                bgcolor: isDragActive ? '#e3f2fd' : '#f8f9fa', cursor: 'pointer', mb: 3
              }}
            >
              <input {...getInputProps()} />
              <UploadIcon sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
              <Typography variant="h6">{isDragActive ? 'Drop file' : 'Drag & drop DPR PDF here'}</Typography>
            </Box>
            {file && <Typography sx={{ mb: 2, fontWeight: 'bold' }}>Selected: {file.name}</Typography>}
            <Button
              variant="contained" size="large" onClick={handleUploadAndAnalyze} disabled={!file}
              sx={{ bgcolor: '#0f2c59' }}
            >
              Analyze DPR
            </Button>
            <Button
              variant="outlined" size="large" 
              onClick={async () => {
                try {
                  const res = await fetch('/real_DPR.pdf');
                  const blob = await res.blob();
                  setFile(new File([blob], 'real_DPR.pdf', { type: 'application/pdf' }));
                } catch (err) {
                  console.error(err);
                }
              }}
              sx={{ ml: 2 }}
            >
              Load Test DPR
            </Button>
          </CardContent>
        </Card>
      )}

      {activeStep === 'processing' && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={80} sx={{ mb: 4 }} />
          <Typography variant="h5">Analyzing Document via RAG & AI...</Typography>
          <Typography color="text.secondary">Extracting images, chunking text, and querying compliance</Typography>
        </Box>
      )}

      {activeStep === 'results' && report && (
        <Grid container spacing={3}>
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', '@media print': { display: 'none' } }}>
            <Button onClick={() => { setActiveStep('upload'); setFile(null); setReport(null); }} sx={{ mb: 2 }}>
              Upload Another
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => window.print()}
              sx={{ mb: 2, bgcolor: '#0f2c59' }}
            >
              Export Report PDF
            </Button>
          </Grid>
          
          {/* New Dynamic Project Summary Card */}
          {report.evaluation_summary && (
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3, mb: 1, bgcolor: '#ffffff', border: '1px solid #dbe4ef' }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#0f2c59' }}>
                      {report.evaluation_summary.project_name || "DPR Analysis Output"}
                    </Typography>
                    <Chip 
                      label={report.evaluation_summary.approval_status || "Pending"} 
                      color={
                        report.evaluation_summary.approval_status?.toLowerCase().includes("approve") ? "success" : 
                        report.evaluation_summary.approval_status?.toLowerCase().includes("reject") ? "error" : "warning"
                      }
                      sx={{ fontWeight: 'bold', borderRadius: 1 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Project Summary & Key Metrics
                  </Typography>

                  {report.evaluation_summary.key_project_metrics && report.evaluation_summary.key_project_metrics.length > 0 && (
                    <Grid container spacing={4} sx={{ mb: 4 }}>
                      {report.evaluation_summary.key_project_metrics.map((metric: any, i: number) => (
                        <Grid item xs={12} sm={6} md={3} key={i}>
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            {/* Simple icon based on index to mock screenshot */}
                            {i === 0 ? '₹' : i === 1 ? '🏢' : i === 2 ? '📍' : '⚙️'} {metric.label}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {metric.main_value}
                          </Typography>
                          {metric.sub_details && metric.sub_details.map((detail: string, j: number) => (
                            <Typography key={j} variant="caption" display="block" color="text.secondary">
                              {detail}
                            </Typography>
                          ))}
                        </Grid>
                      ))}
                    </Grid>
                  )}

                  {report.evaluation_summary.slec_recommendation && (
                    <Box sx={{ bgcolor: '#f4f6f8', p: 3, borderRadius: 2, mb: 4 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#0f2c59' }}>
                        SLEC Recommendation
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {report.evaluation_summary.slec_recommendation}
                      </Typography>
                    </Box>
                  )}

                  {report.evaluation_summary.recommendations && report.evaluation_summary.recommendations.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#0f2c59' }}>
                        Key Actions Required
                      </Typography>
                      <ul style={{ paddingLeft: '20px', margin: 0, color: '#4b5563', fontSize: '0.875rem' }}>
                        {report.evaluation_summary.recommendations.map((rec: string, i: number) => (
                          <li key={i} style={{ marginBottom: '8px' }}>{rec}</li>
                        ))}
                      </ul>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, mb: 3, bgcolor: '#f4f6f8' }}>
              <CardContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#0f2c59' }}>
                    Agentic Analysis Insights
                  </Typography>
                  {reportQuality && (
                    <Chip
                      label={`Quality ${reportQuality.score}/100 · ${reportQuality.qualityLabel}`}
                      color={reportQuality.score >= 80 ? 'success' : reportQuality.score >= 60 ? 'warning' : 'error'}
                      variant="outlined"
                    />
                  )}
                </Box>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {report.executive_summary}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {reportQuality && (
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3, border: '1px solid #dbe4ef', bgcolor: '#ffffff' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#0f2c59' }}>
                    Report Quality Snapshot
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Chip label={`Insights: ${reportQuality.insightCount}`} color="primary" variant="outlined" sx={{ width: '100%' }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Chip label={`Evidence-backed: ${reportQuality.insightEvidenceCount}`} color="success" variant="outlined" sx={{ width: '100%' }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Chip label={`Evaluation blocks: ${reportQuality.evaluationPieces}/3`} color="warning" variant="outlined" sx={{ width: '100%' }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Chip label={`Images: ${reportQuality.extractedImagesCount}`} color="info" variant="outlined" sx={{ width: '100%' }} />
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: '#f8fbff', border: '1px solid #e3eef9' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f2c59', display: 'block', mb: 0.5 }}>
                      Score legend
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.6 }}>
                      80-100 = strong evidence coverage and structured output. 60-79 = usable but partial support. Below 60 = review needed before relying on the report.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {report.evaluation_summary && (report.evaluation_summary.flagged_risks.length > 0 || report.evaluation_summary.missing_sections.length > 0) && (
            <Grid item xs={12}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Additional Flagged Items</Typography>
              <Grid container spacing={2}>
                {report.evaluation_summary.flagged_risks.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', borderRadius: 3, borderTop: '6px solid #d32f2f', bgcolor: '#fff5f5' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: '#d32f2f', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          🚨 Flagged Risks
                        </Typography>
                        <ul style={{ paddingLeft: '20px', margin: 0 }}>
                          {report.evaluation_summary.flagged_risks.map((risk: string, i: number) => (
                            <li key={i} style={{ marginBottom: '8px' }}><Typography variant="body2">{risk}</Typography></li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                {report.evaluation_summary.missing_sections.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', borderRadius: 3, borderTop: '6px solid #ed6c02', bgcolor: '#fff8f0' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ color: '#ed6c02', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          ⚠️ Missing Context
                        </Typography>
                        <ul style={{ paddingLeft: '20px', margin: 0 }}>
                          {report.evaluation_summary.missing_sections.map((item: string, i: number) => (
                            <li key={i} style={{ marginBottom: '8px' }}><Typography variant="body2">{item}</Typography></li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, bgcolor: '#f4f6f8' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#0f2c59' }}>
                    Agentic Analysis Specifics
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {report.insights?.map((insight: any, i: number) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box sx={{ mt: 0.5, fontSize: '1.25rem' }}>
                        {i % 4 === 0 ? '💡' : i % 4 === 1 ? '📊' : i % 4 === 2 ? '🎯' : '🌿'}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                          {insight.topic}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569', mt: 0.5, mb: 1 }}>
                          {insight.details}
                        </Typography>
                        
                        {insight.extracted_values && Object.keys(insight.extracted_values).length > 0 && (
                          <Grid container spacing={2} sx={{ mt: 1, p: 2, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                            {Object.entries(insight.extracted_values).map(([key, value], idx) => (
                              <Grid item xs={12} sm={6} md={3} key={idx}>
                                <Typography variant="caption" color="text.secondary" display="block">{key}</Typography>
                                <Typography variant="body2" fontWeight="bold">{String(value)}</Typography>
                              </Grid>
                            ))}
                          </Grid>
                        )}
                        {insight.risks?.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            {insight.risks.map((risk: string, j: number) => (
                              <Typography key={j} variant="caption" sx={{ color: '#d32f2f', display: 'block' }}>
                                • {risk}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {report.extracted_images?.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h5" sx={{ mt: 4, mb: 2, fontWeight: 'bold' }}>Extracted Visuals</Typography>
              <Grid container spacing={2}>
                {report.extracted_images.map((img: any, i: number) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Card sx={{ height: '100%', borderRadius: 2 }}>
                      <CardContent>
                        <Chip label={`Page Data`} size="small" sx={{ mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">{img.caption}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          )}

        </Grid>
      )}
    </Container>
  );
};

export default AnalysisDashboard;
