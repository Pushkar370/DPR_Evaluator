import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Stack, Button, Alert, CircularProgress, Chip, Paper
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { dprApi } from '../services/api';

const UploadDocuments: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);

    try {
      const data = await dprApi.uploadDPR(selectedFile);
      localStorage.setItem('dpr_job_id', data.job_id);
      // Redirect to Analysis page with the active jobId
      navigate('/analysis', { state: { jobId: data.job_id } });
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to upload document');
      setIsUploading(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f2c59', mb: 1 }}>
          Upload DPR Documents
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload Detailed Project Report (PDF) for automated 5-agent LangGraph evaluation against MDoNER / NE-SIDS guidelines.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {!selectedFile ? (
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed #90caf9',
                borderRadius: 2,
                bgcolor: isDragActive ? '#e3f2fd' : '#f8f9fa',
                p: 6,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: '#f1f8ff',
                  borderColor: '#2196f3'
                }
              }}
            >
              <input {...getInputProps()} />
              <Stack spacing={2} alignItems="center">
                <Box
                  sx={{
                    bgcolor: '#e3f2fd',
                    color: '#1976d2',
                    borderRadius: '50%',
                    p: 2.5
                  }}
                >
                  <CloudUploadIcon sx={{ fontSize: 48 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Drag & drop DPR PDF here
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  or <span style={{ color: '#1976d2', textDecoration: 'underline' }}>browse your computer</span>
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Chip label="PDF Documents Only" size="small" variant="outlined" color="primary" />
                  <Chip label="Native & Scanned Supported" size="small" variant="outlined" />
                </Stack>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Maximum file size: 100MB • Page-by-page OCR enabled
                </Typography>
              </Stack>
            </Box>
          ) : (
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: '#fbfcfe' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    bgcolor: '#ffebee',
                    color: '#d32f2f',
                    p: 1.5,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <PictureAsPdfIcon sx={{ fontSize: 36 }} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI Evaluation
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  startIcon={<DeleteOutlineIcon />}
                  onClick={handleClearFile}
                  disabled={isUploading}
                >
                  Remove
                </Button>
              </Stack>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                  onClick={handleUpload}
                  disabled={isUploading}
                  sx={{ px: 4, py: 1.2, fontWeight: 700 }}
                >
                  {isUploading ? 'Uploading & Initializing...' : 'Start 5-Agent Evaluation'}
                </Button>
              </Box>
            </Paper>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default UploadDocuments;
