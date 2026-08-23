import React from 'react';
import { Box, Typography, Stack } from '@mui/material';

/**
 * Login Branding Section
 * Displays government branding and system information
 */
export const LoginBranding: React.FC = () => {
  return (
    <Box sx={{
      flex: 1,
      bgcolor: '#0f2c59',
      color: 'white',
      p: 5,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Circle */}
      <Box sx={{
        position: 'absolute',
        top: -50,
        left: -50,
        width: 200,
        height: 200,
        bgcolor: 'rgba(255,255,255,0.05)',
        borderRadius: '50%'
      }} />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
          alt="Emblem"
          style={{ height: 80, marginBottom: 20, filter: 'brightness(0) invert(1)' }}
        />
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          DPR Quality Assessment System
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.8, mb: 4 }}>
          Advanced AI-powered portal for monitoring, analyzing, and grading Development Project Reports.
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <img 
            src="/digital-india-logo.png" 
            alt="Digital India" 
            style={{ height: 40, background: 'white', padding: 5, borderRadius: 4 }} 
            onError={(e) => e.currentTarget.style.display = 'none'} 
          />
        </Stack>
      </Box>
    </Box>
  );
};
