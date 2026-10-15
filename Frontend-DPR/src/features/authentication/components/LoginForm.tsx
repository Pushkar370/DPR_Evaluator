import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  InputAdornment,
  IconButton,
  Divider,
  Alert
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import { User } from '../../../types';
import { MOCK_USERS, MOCK_CREDENTIALS } from '../../../constants';

import { useAuth } from '../../../hooks/useAuth';

/**
 * Login Form Component
 * Handles user authentication and form submission
 */
export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    let userProfile: User | null = null;

    if (email === MOCK_CREDENTIALS.admin.username && password === MOCK_CREDENTIALS.admin.password) {
      userProfile = MOCK_USERS.admin;
    } else if (email === MOCK_CREDENTIALS.author.username && password === MOCK_CREDENTIALS.author.password) {
      userProfile = MOCK_USERS.author;
    } else if (email === MOCK_CREDENTIALS.public.username && password === MOCK_CREDENTIALS.public.password) {
      userProfile = MOCK_USERS.public;
    }

    if (userProfile) {
      login(userProfile);
    } else {
      setError('Invalid credentials. Try admin/admin, author/author, or public/public');
    }
  };

  return (
    <Box sx={{ flex: 1, p: 5 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#333', mb: 1 }}>
        Sign In
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter your credentials to access the portal
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <form onSubmit={handleLogin}>
        <Stack spacing={3}>
          <TextField
            label="Username / Email"
            fullWidth
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            helperText="Demo: admin, author, public"
          />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="Demo: admin, author, public"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Mock Captcha */}
          <Box sx={{ p: 1.5, bgcolor: '#f0f2f5', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontFamily: 'monospace', letterSpacing: 3, fontWeight: 'bold', color: '#555' }}>
              8 X 2 A
            </Typography>
            <Button size="small">Refresh</Button>
          </Box>
          <TextField
            placeholder="Enter Captcha"
            size="small"
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            startIcon={<LoginIcon />}
            sx={{ py: 1.5, fontWeight: 600 }}
          >
            Login
          </Button>

          <Divider>OR</Divider>

          <Button
            variant="outlined"
            size="large"
            fullWidth
            startIcon={<FingerprintIcon />}
            sx={{ py: 1.5, fontWeight: 600, color: '#0B3C5D', borderColor: '#0B3C5D' }}
          >
            Login with Parichay
          </Button>
        </Stack>
      </form>
    </Box>
  );
};
