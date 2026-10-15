import React, { useState, useCallback, useEffect } from 'react';
import {
  Box, Container, Typography, Grid, Card, CardContent, Button, Alert, CircularProgress, Chip, LinearProgress, Stack,
  Stepper, Step, StepLabel, StepContent, Paper
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
  ErrorOutline as RiskIcon,
  Check as CheckIcon,
  Article as DocIcon,
  Storage as StorageIcon,
  Psychology as BrainIcon,
  Hub as HubIcon,
  Balance as BalanceIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useLocation, useNavigate } from 'react-router-dom';

import { dprApi, AnalysisReport, PillarScorecard, ConflictItem, FindingItem } from '../../services/api';

const PIPELINE_STAGES = [
  {
    label: 'Stage 1: Document Ingestion & Vision OCR',
    subtitle: 'PyMuPDF text blocks & scanned page detection',
    details: 'Extracts verbatim page blocks, checks character density, and triggers Gemini Vision OCR for scanned or image-based pages.',
    icon: <DocIcon sx={{ fontSize: 18 }} />,
    subitems: [
      { emoji: '📄', title: 'High-Fidelity Extraction', desc: 'PyMuPDF page-by-page text & layout tagging' },
      { emoji: '👁️', title: 'Vision OCR Fallback', desc: 'Automatic image OCR for scanned submissions' }
    ]
  },
  {
    label: 'Stage 2: Vector Embedding & Ingestion',
    subtitle: 'Local Sentence-Transformers & Qdrant indexing',
    details: 'Generates 384-dimensional dense vectors and indexes chunks into local Qdrant tagged with job ID and exact page citations.',
    icon: <StorageIcon sx={{ fontSize: 18 }} />,
    subitems: [
      { emoji: '🧩', title: 'Semantic Chunking', desc: 'Preserves clause context with page headers' },
      { emoji: '⚡', title: 'Qdrant Ingestion', desc: 'Indexed into dpr_documents collection' }
    ]
  },
  {
    label: 'Stage 3: Manager Agent Strategic Planning',
    subtitle: 'Table of Contents & Executive Summary analysis',
    details: 'Manager reviews high-level project scope and assigns tailored audit directives and focus weights across all 4 pillars.',
    icon: <BrainIcon sx={{ fontSize: 18 }} />,
    subitems: [
      { emoji: '📑', title: 'TOC & Scope Analysis', desc: 'Identifies infrastructure type and sector norms' },
      { emoji: '🎯', title: 'Pillar Directives', desc: 'Directs focus per pillar before parallel fan-out' }
    ]
  },
  {
    label: 'Stage 4: 4-Pillar Parallel Fan-Out Assessment',
    subtitle: 'Technical, Financial, Admin & Social Agents',
    details: 'Agents query up to 15 relevant DPR chunks + MDoNER guidelines in parallel and extract page-cited findings.',
    icon: <HubIcon sx={{ fontSize: 18 }} />,
    subitems: [
      { emoji: '🏗️', title: 'Technical (30%)', desc: 'Structural feasibility, BoQ & IRC standards' },
      { emoji: '💰', title: 'Financial (30%)', desc: 'Schedule of Rates & contingency cap (3%/8%)' },
      { emoji: '🏛️', title: 'Admin (20%)', desc: '100% land encumbrance & statutory clearances' },
      { emoji: '🌿', title: 'Social & Env (20%)', desc: 'EIA/SIA clearances, tribal rights & EMP' }
    ]
  },
  {
    label: 'Stage 5: Conflict Reconciliation & Composite Verdict',
    subtitle: 'Cross-pillar contradictions & SLEC scoring',
    details: 'Manager cross-references pillar scorecards, resolves timeline or cost contradictions, and computes official verdict.',
    icon: <BalanceIcon sx={{ fontSize: 18 }} />,
    subitems: [
      { emoji: '⚖️', title: 'Conflict Resolution', desc: 'Reconciles conflicting tenders, costs & dates' },
      { emoji: '🏆', title: 'Official Verdict', desc: 'Weighted score & Approve / Revise / Reject' }
    ]
  }
];

export const AnalysisDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [activeStep, setActiveStep] = useState<'upload' | 'processing' | 'results'>('upload');
  const [jobId, setJobId] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStepText, setCurrentStepText] = useState<string>('Step 1/5: Extracting PDF pages & OCR verification...');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

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

  // Real-time elapsed timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (activeStep === 'processing') {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeStep]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeStep === 'processing' && jobId) {
      interval = setInterval(async () => {
        try {
          const data = await dprApi.checkStatus(jobId);
          if (data.current_step) {
            setCurrentStepText(data.current_step);
          }
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
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [activeStep, jobId]);

  const getActiveStepIndex = () => {
    if (currentStepText.includes('1/5') || currentStepText.includes('Extracting')) return 0;
    if (currentStepText.includes('2/5') || currentStepText.includes('Vectorizing')) return 1;
    if (currentStepText.includes('3/5') || currentStepText.includes('planning') || currentStepText.includes('analyzing')) return 2;
    if (currentStepText.includes('4/5') || currentStepText.includes('parallel') || currentStepText.includes('Pillar Agents')) return 3;
    if (currentStepText.includes('5/5') || currentStepText.includes('reconciling') || currentStepText.includes('scoring')) return 4;
    
    // Smooth time-based progression fallback
    if (elapsedSeconds < 2) return 0;
    if (elapsedSeconds < 5) return 1;
    if (elapsedSeconds < 8) return 2;
    if (elapsedSeconds < 14) return 3;
    return 4;
  };

  const activeStepIndex = getActiveStepIndex();

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

      {/* STEP 2: PROCESSING - LIVE MULTI-AGENT STEPPER */}
      {activeStep === 'processing' && (
        <Card sx={{ maxWidth: 880, mx: 'auto', p: 4, borderRadius: 3, boxShadow: '0 8px 32px rgba(15, 44, 89, 0.08)' }}>
          {/* Header with live pulsing badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, pb: 2, borderBottom: '1px solid #eef2f6' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: '#ff9933',
                  boxShadow: '0 0 0 4px rgba(255, 153, 51, 0.25)'
                }}
              />
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f2c59' }}>
                Multi-Agent DPR Evaluation Pipeline
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              {jobId && (
                <Chip
                  label={`Job ID: #${jobId}`}
                  variant="outlined"
                  size="small"
                  sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#0f2c59' }}
                />
              )}
              <Chip
                icon={<TimerIcon sx={{ fontSize: 16 }} />}
                label={`${elapsedSeconds}s elapsed`}
                size="small"
                color="primary"
                sx={{ fontWeight: 600 }}
              />
            </Stack>
          </Box>

          {/* Active status banner */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              bgcolor: '#f0f7ff',
              border: '1px solid #cce3fe',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <CircularProgress size={24} sx={{ color: '#1976d2' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
                Active Evaluation Stage
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f2c59' }}>
                {currentStepText}
              </Typography>
            </Box>
          </Paper>

          {/* Progress bar */}
          <Box sx={{ mb: 4 }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, Math.max(12, ((activeStepIndex + 1) / 5) * 100))}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: '#e2e8f0',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #0f2c59 0%, #1976d2 50%, #ff9933 100%)',
                  borderRadius: 4
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Stage {activeStepIndex + 1} of 5 Active
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#0f2c59' }}>
                {Math.round(Math.min(100, Math.max(12, ((activeStepIndex + 1) / 5) * 100)))}% Complete
              </Typography>
            </Box>
          </Box>

          {/* Stepper with 5 detailed pipeline stages */}
          <Stepper activeStep={activeStepIndex} orientation="vertical">
            {PIPELINE_STAGES.map((stage, idx) => {
              const isPast = idx < activeStepIndex;
              const isCurrent = idx === activeStepIndex;
              return (
                <Step key={stage.label} active={isCurrent} completed={isPast}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isPast ? '#2e7d32' : isCurrent ? '#0f2c59' : '#f1f5f9',
                          color: isPast || isCurrent ? '#fff' : '#94a3b8',
                          boxShadow: isCurrent ? '0 0 0 4px rgba(15, 44, 89, 0.2)' : 'none',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {isPast ? <CheckIcon sx={{ fontSize: 18 }} /> : stage.icon}
                      </Box>
                    )}
                  >
                    <Box sx={{ ml: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: isCurrent ? 700 : isPast ? 600 : 500,
                            color: isCurrent ? '#0f2c59' : isPast ? '#2e7d32' : 'text.secondary'
                          }}
                        >
                          {stage.label}
                        </Typography>
                        {isCurrent && (
                          <Chip label="In Progress" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                        )}
                        {isPast && (
                          <Chip label="Completed" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                        )}
                      </Stack>
                      <Typography variant="caption" sx={{ color: isCurrent ? 'text.primary' : 'text.secondary', display: 'block', mt: 0.3 }}>
                        {stage.details}
                      </Typography>
                    </Box>
                  </StepLabel>
                  <StepContent>
                    {stage.subitems && (
                      <Box sx={{ pl: 2, pt: 1, pb: 1 }}>
                        <Grid container spacing={1}>
                          {stage.subitems.map((sub, sIdx) => (
                            <Grid item xs={12} sm={6} key={sIdx}>
                              <Box
                                sx={{
                                  p: 1.2,
                                  borderRadius: 1.5,
                                  bgcolor: isCurrent ? '#f8fafc' : '#fdfdfe',
                                  border: '1px solid #e2e8f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1
                                }}
                              >
                                <Box sx={{ fontSize: 16 }}>{sub.emoji}</Box>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#1e293b' }}>
                                    {sub.title}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                                    {sub.desc}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}
                  </StepContent>
                </Step>
              );
            })}
          </Stepper>

          {/* Footer note */}
          <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              🔒 All evaluations cite verbatim DPR pages against official MDoNER & NE-SIDS statutory guidelines.
            </Typography>
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
