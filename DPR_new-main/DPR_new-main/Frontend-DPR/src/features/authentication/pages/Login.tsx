import React from 'react';
import { Box, Paper, Typography, Container, Stack } from '@mui/material';
import { User } from '../../../types';
import { LoginBranding, LoginForm } from '../components';

const Login: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <Box sx={{ bgcolor: '#0B3C5D', py: 1 }}>
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" spacing={2}>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
              alt="Emblem"
              style={{ height: 40, filter: 'brightness(0) invert(1)' }}
            />
            <Box>
              <Typography variant="caption" sx={{ color: '#fff', fontSize: '0.7rem' }}>
                GOVERNMENT OF INDIA
              </Typography>
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                Government of India
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Paper
          elevation={4}
          sx={{
            maxWidth: 900,
            width: '100%',
            display: 'flex',
            borderRadius: 3,
            overflow: 'hidden',
            flexDirection: { xs: 'column', md: 'row' }
          }}
        >
          {/* Left Side: Branding */}
          <LoginBranding />

          {/* Right Side: Login Form */}
          <LoginForm />
        </Paper>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 2, textAlign: 'center', bgcolor: '#e0e0e0' }}>
        <Typography variant="caption" color="text.secondary">
          Designed, Developed and Hosted by National Informatics Centre (NIC)
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;
