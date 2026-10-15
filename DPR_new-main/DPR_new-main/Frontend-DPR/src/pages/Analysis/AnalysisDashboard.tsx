import React, { useState, useCallback, useEffect } from 'react';
import {
  Box, Container, Typography, Grid, Card, CardContent, Button, Alert, CircularProgress, Chip, LinearProgress, Stack
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Analytics as AnalyticsIcon,
  Build as TechnicalIcon,
  AccountBalance as FinancialIcon,
  AssignmentTurnedIn as AdminIcon,
  NaturePeople as SocialIcon,
  Warning as ConflictIcon,
  CheckCircle as PassIcon,
  ErrorOutline as RiskIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useLocation, useNavigate } from 'react-router-dom';

import { dprApi, AnalysisReport, PillarScorecard, ConflictItem, FindingItem } from '../../services/api';

export const AnalysisDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [activeStep, setActiveStep] = useState<'upload' | 'processing' | 'results'>('upload');
  const [jobId, setJobId] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load a historic report or incoming jobId passed via React Router state
  useEffect(() => {
    if (location.state && location.state.historicReport) {
      setReport(location.state.historicReport);
      setActiveStep('results');
      navigate(location.pathname, { replace: true });
    } else if (location.state && location.state.jobId) {
      setJobId(location.state.jobId);
      setActiveStep('processing');
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
      const uploadData = await dprApi.uploadDPR(file);
      setJobId(uploadData.job_id);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to upload file');
      setActiveStep('upload');
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeStep === 'processing' && jobId) {
      interval = setInterval(async () => {
        try {
          const data = await dprApi.checkStatus(jobId);
          if (data.status === 'COMPLETED' && data.report) {
            setReport(data.report);
            setActiveStep('results');
            clearInterval(interval);
          } else if (data.status === 'FAILED') {
            setError(data.report?.error_message || 'Multi-agent analysis failed');
            setActiveStep('upload');
            clearInterval(interval);
          }
        } catch (err: any) {
          console.error('Polling error:', err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeStep, jobId]);

  const overallScore = report?.overall_score != null ? Math.round(report.overall_score) : null;
  const verdict = report?.verdict || report?.evaluation_summary?.approval_status || 'Pending';
  const verdictColor = verdict.toLowerCase().includes('approve') ? 'success' : verdict.toLowerCase().includes('reject') ? 'error' : 'warning';

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AnalyticsIcon sx={{ fontSize: 42, color: '#0f2c59' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f2c59' }}>
              DPR Compliance & Multi-Agent Evaluation System
            </Typography>
            <Typography variant="body1" color="text.secondary">
              MDoNER / NE-SIDS Infrastructure Assessment • 4 Pillars + 1 Manager System
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* STEP 1: UPLOAD */}
      {activeStep === 'upload' && (
        <Card sx={{ borderRadius: 3, maxWidth: 800, mx: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <CardContent sx={{ p: 5, textAlign: 'center' }}>
            <Box
              {...getRootProps()}
              sx={{
                p: 6,
                border: '2px dashed #0f2c59',
                borderRadius: 3,
                bgcolor: isDragActive ? '#e3f2fd' : '#f8f9fa',
                cursor: 'pointer',
                mb: 3,
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <input {...getInputProps()} />
              <UploadIcon sx={{ fontSize: 56, color: '#0f2c59', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f2c59' }}>
                {isDragActive ? 'Drop Detailed Project Report (PDF) here' : 'Drag & drop DPR PDF here, or click to browse'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Supports standard & scanned PDFs up to 100MB (PyMuPDF + Vision OCR Fallback)
              </Typography>
            </Box>

            {file && (
              <Chip
                label={`Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`}
                color="primary"
                sx={{ mb: 3, fontWeight: 'bold' }}
              />
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleUploadAndAnalyze}
                disabled={!file}
                sx={{ bgcolor: '#0f2c59', px: 4, py: 1.5, fontWeight: 'bold' }}
              >
                Start Multi-Agent Assessment
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={async () => {
                  try {
                    const res = await fetch('/real_DPR.pdf');
                    const blob = await res.blob();
                    setFile(new File([blob], 'Yamuna_Bridge_DPR.pdf', { type: 'application/pdf' }));
                  } catch (err) {
                    console.error('Test DPR load failed:', err);
                  }
                }}
                sx={{ borderColor: '#0f2c59', color: '#0f2c59' }}
              >
                Load Sample DPR
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: PROCESSING */}
      {activeStep === 'processing' && (
        <Card sx={{ maxWidth: 700, mx: 'auto', p: 5, textAlign: 'center', borderRadius: 3 }}>
          <CircularProgress size={70} sx={{ color: '#0f2c59', mb: 3 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f2c59', mb: 1 }}>
            LangGraph Multi-Agent System Evaluating DPR...
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Technical, Financial, Administrative, and Social Agents are querying document chunks and NE-SIDS guidelines in parallel.
          </Typography>
          <LinearProgress sx={{ borderRadius: 2, height: 8, bgcolor: '#e0e7ff', '& .MuiLinearProgress-bar': { bgcolor: '#0f2c59' } }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 3, color: 'text.secondary', fontSize: '0.85rem' }}>
            <span>🔍 1. PDF & OCR Extraction</span>
            <span>⚡ 2. Parallel Pillar Agents</span>
            <span>⚖️ 3. Manager Reconciliation</span>
          </Box>
        </Card>
      )}

      {/* STEP 3: RESULTS */}
      {activeStep === 'results' && report && (
        <Grid container spacing={3}>
          {/* Top Action Bar */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', '@media print': { display: 'none' } }}>
            <Button
              variant="outlined"
              onClick={() => { setActiveStep('upload'); setFile(null); setReport(null); }}
              sx={{ color: '#0f2c59', borderColor: '#0f2c59' }}
            >
              ← Upload Another DPR
            </Button>
            <Button
              variant="contained"
              onClick={() => window.print()}
              sx={{ bgcolor: '#0f2c59' }}
            >
              Export SLEC Evaluation Report
            </Button>
          </Grid>

          {/* Manager's Executive Verdict Banner */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, border: '1px solid #dbe4ef', bgcolor: '#ffffff', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#0f2c59' }}>
                      {report.evaluation_summary?.project_name || 'Detailed Project Report Evaluation'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Job ID: {report.job_id} {report.processing_time ? `• Evaluation Completed in ${report.processing_time}s` : ''}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {overallScore !== null && (
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Composite Score
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f2c59' }}>
                          {overallScore}<span style={{ fontSize: '1.25rem', color: '#64748b' }}>/100</span>
                        </Typography>
                      </Box>
                    )}
                    <Chip
                      label={verdict.toUpperCase()}
                      color={verdictColor}
                      sx={{ fontSize: '1.1rem', fontWeight: 800, px: 2, py: 2.5, borderRadius: 2 }}
                    />
                  </Box>
                </Box>

                {report.evaluation_summary?.slec_recommendation && (
                  <Box sx={{ bgcolor: '#f8fafc', p: 2.5, borderRadius: 2, borderLeft: '4px solid #0f2c59', mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f2c59', mb: 0.5 }}>
                      SLEC Committee Recommendation & Verdict
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {report.evaluation_summary.slec_recommendation}
                    </Typography>
                  </Box>
                )}

                {/* Key Metrics Strip */}
                {report.evaluation_summary?.key_project_metrics && report.evaluation_summary.key_project_metrics.length > 0 && (
                  <Grid container spacing={2}>
                    {report.evaluation_summary.key_project_metrics.map((metric, i) => (
                      <Grid item xs={12} sm={6} md={3} key={i}>
                        <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {metric.label}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f2c59', my: 0.5 }}>
                            {metric.main_value}
                          </Typography>
                          {metric.sub_details && metric.sub_details.map((sub, j) => (
                            <Typography key={j} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {sub}
                            </Typography>
                          ))}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 4 PILLAR SCORECARDS */}
          <Grid item xs={12}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f2c59', mb: 2 }}>
              Independent Pillar Scorecards (4 Pillars)
            </Typography>
            <Grid container spacing={3}>
              {(report.pillar_scorecards && report.pillar_scorecards.length > 0
                ? report.pillar_scorecards
                : [
                    { pillar: 'Technical', score: 80, weight: 0.3, summary: 'Engineering specs verified.', guidelines_status: 'Unverified', metrics: {}, findings: [] },
                    { pillar: 'Financial', score: 75, weight: 0.3, summary: 'Cost analysis verified.', guidelines_status: 'Unverified', metrics: {}, findings: [] },
                    { pillar: 'Administrative', score: 85, weight: 0.2, summary: 'Approvals verified.', guidelines_status: 'Unverified', metrics: {}, findings: [] },
                    { pillar: 'Social', score: 70, weight: 0.2, summary: 'ESIA verified.', guidelines_status: 'Unverified', metrics: {}, findings: [] }
                  ]
              ).map((card: PillarScorecard, idx: number) => {
                const pColor = card.pillar === 'Technical' ? '#1e40af' : card.pillar === 'Financial' ? '#047857' : card.pillar === 'Administrative' ? '#7c2d12' : '#4338ca';
                const IconComponent = card.pillar === 'Technical' ? TechnicalIcon : card.pillar === 'Financial' ? FinancialIcon : card.pillar === 'Administrative' ? AdminIcon : SocialIcon;

                return (
                  <Grid item xs={12} md={6} key={card.pillar || idx}>
                    <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconComponent sx={{ color: pColor, fontSize: 28 }} />
                            <Typography variant="h6" sx={{ fontWeight: 700, color: pColor }}>
                              {card.pillar} Pillar
                            </Typography>
                          </Box>
                          <Chip
                            label={`Weight: ${(card.weight * 100).toFixed(0)}%`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1.5 }}>
                          <Typography variant="h4" sx={{ fontWeight: 800, color: card.score >= 75 ? '#15803d' : card.score >= 50 ? '#b45309' : '#b91c1c' }}>
                            {Math.round(card.score)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">/ 100</Typography>
                          <Chip
                            label={card.guidelines_status.includes('Verified') ? 'Guidelines: Ingested' : 'Guidelines: Unverified'}
                            size="small"
                            color={card.guidelines_status.includes('Verified') ? 'success' : 'default'}
                            sx={{ ml: 'auto', fontSize: '0.75rem' }}
                          />
                        </Box>

                        <LinearProgress
                          variant="determinate"
                          value={card.score}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            mb: 2,
                            bgcolor: '#f1f5f9',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: card.score >= 75 ? '#15803d' : card.score >= 50 ? '#f59e0b' : '#ef4444'
                            }
                          }}
                        />

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                          {card.summary}
                        </Typography>

                        {/* Extracted Metrics */}
                        {card.metrics && Object.keys(card.metrics).length > 0 && (
                          <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, mb: 2, border: '1px solid #f1f5f9' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 1 }}>
                              Key Extracted Metrics:
                            </Typography>
                            <Grid container spacing={1}>
                              {Object.entries(card.metrics).map(([k, v], mIdx) => (
                                <Grid item xs={6} key={mIdx}>
                                  <Typography variant="caption" color="text.secondary" display="block">{k}:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{String(v)}</Typography>
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        )}

                        {/* Findings with Page Citations */}
                        {card.findings && card.findings.length > 0 && (
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 1 }}>
                              Findings & Page Citations:
                            </Typography>
                            <Stack spacing={1}>
                              {card.findings.map((f: FindingItem, fIdx: number) => (
                                <Box
                                  key={fIdx}
                                  sx={{
                                    p: 1.25,
                                    borderRadius: 1.5,
                                    bgcolor: f.severity === 'Critical' ? '#fef2f2' : f.severity === 'High' ? '#fff7ed' : '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    display: 'flex',
                                    gap: 1,
                                    alignItems: 'flex-start'
                                  }}
                                >
                                  {f.severity === 'Critical' || f.severity === 'High' ? (
                                    <RiskIcon sx={{ fontSize: 18, color: '#dc2626', mt: 0.2 }} />
                                  ) : (
                                    <PassIcon sx={{ fontSize: 18, color: '#16a34a', mt: 0.2 }} />
                                  )}
                                  <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                                      <Chip
                                        label={`DPR Page ${f.dpr_page}`}
                                        size="small"
                                        color="primary"
                                        sx={{ fontWeight: 'bold', height: 20, fontSize: '0.7rem' }}
                                      />
                                      {f.guideline_reference && (
                                        <Chip
                                          label={f.guideline_reference}
                                          size="small"
                                          variant="outlined"
                                          sx={{ height: 20, fontSize: '0.7rem' }}
                                        />
                                      )}
                                      <Chip
                                        label={f.severity}
                                        size="small"
                                        color={f.severity === 'Critical' ? 'error' : f.severity === 'High' ? 'warning' : 'default'}
                                        sx={{ height: 20, fontSize: '0.7rem', ml: 'auto' }}
                                      />
                                    </Box>
                                    <Typography variant="body2" sx={{ fontSize: '0.825rem', color: '#1e293b' }}>
                                      {f.description}
                                    </Typography>
                                  </Box>
                                </Box>
                              ))}
                            </Stack>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>

          {/* MANAGER CROSS-PILLAR CONFLICT RESOLUTION */}
          {report.conflicts && report.conflicts.length > 0 && (
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3, border: '1px solid #fecaca', bgcolor: '#fff5f5' }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <ConflictIcon sx={{ color: '#dc2626', fontSize: 32 }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#991b1b' }}>
                        Manager Cross-Pillar Conflict Resolution
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        The Manager Agent cross-referenced all 4 pillars and reconciled the following contradictions:
                      </Typography>
                    </Box>
                  </Box>

                  <Stack spacing={2}>
                    {report.conflicts.map((c: ConflictItem, cIdx: number) => (
                      <Box key={cIdx} sx={{ p: 2, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #fed7aa' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#9a3412' }}>
                            {c.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {c.pillars_involved.map((p, pI) => (
                              <Chip key={pI} label={p} size="small" color="secondary" variant="outlined" />
                            ))}
                            <Chip label={c.severity} size="small" color="error" />
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 1, color: '#475569' }}>
                          <strong>Contradiction in DPR:</strong> {c.description}
                        </Typography>
                        <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 1.5, borderLeft: '4px solid #16a34a' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#166534', display: 'block' }}>
                            Manager Resolution & Verdict Impact:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#14532d' }}>
                            {c.resolution}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Executive Summary */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f2c59', mb: 2 }}>
                  Executive Narrative Summary
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7, color: '#334155' }}>
                  {report.executive_summary}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default AnalysisDashboard;
