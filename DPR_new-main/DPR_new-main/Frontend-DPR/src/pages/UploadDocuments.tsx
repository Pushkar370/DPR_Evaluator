import React, { useCallback } from 'react';
import { Box, Typography, Card, CardContent, Stack, Button, IconButton } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // For user icon placeholder

const UploadDocuments: React.FC = () => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        console.log(acceptedFiles);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt']
        },
        maxSize: 52428800, // 50MB
        maxFiles: 10
    });

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f2c59', mb: 1 }}>
                    Upload Documents
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Upload DPR documents for quality assessment and risk analysis
                </Typography>
            </Box>

            <Card sx={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        Upload DPR Documents
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        Upload PDF, DOCX, or TXT files for analysis
                    </Typography>

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
                                    p: 2
                                }}
                            >
                                <CloudUploadIcon sx={{ fontSize: 40 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Drag & drop files here
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                or <span style={{ color: '#1976d2', textDecoration: 'underline' }}>click to select files</span>
                            </Typography>

                            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, px: 1, py: 0.5, fontSize: '0.75rem', color: '#666' }}>PDF</Box>
                                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, px: 1, py: 0.5, fontSize: '0.75rem', color: '#666' }}>DOCX</Box>
                                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, px: 1, py: 0.5, fontSize: '0.75rem', color: '#666' }}>TXT</Box>
                            </Stack>

                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Max file sizes: PDF (50MB), DOCX (20MB), TXT (5MB) • Max 10 files
                            </Typography>
                        </Stack>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default UploadDocuments;
