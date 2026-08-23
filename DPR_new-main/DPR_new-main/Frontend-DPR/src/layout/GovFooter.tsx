import React from 'react';
import { Box, Container, Typography, Link, Stack, Divider } from '@mui/material';

const GovFooter: React.FC = () => {
  return (
    <Box component="footer" sx={{ bgcolor: '#0b1e3c', color: '#fff', paddingTop: 6, paddingBottom: 2, borderTop: '4px solid #ff9933' }}>
      <Box sx={{ px: { xs: 2, md: 3 }, width: '100%', boxSizing: 'border-box' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, mb: 4 }}>
          {/* Column 1: Ministry Info */}
          <Box sx={{ flex: '1 1 300px' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#ff9933' }}>
              Central Project Monitoring System
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.8, opacity: 0.9 }}>
              Government of India<br />
              New Delhi - 110001
            </Typography>
          </Box>

          {/* Column 2: Quick Links */}
          <Box sx={{ flex: '1 1 150px' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#ff9933' }}>
              Quick Links
            </Typography>
            <Stack spacing={1}>
              {['Home', 'About Us', 'Schemes', 'Tenders', 'Vacancies'].map(item => (
                <Link key={item} href="#" color="inherit" underline="hover" sx={{ opacity: 0.8, fontSize: '0.9rem' }}>
                  {item}
                </Link>
              ))}
            </Stack>
          </Box>

          {/* Column 3: Important Links */}
          <Box sx={{ flex: '1 1 200px' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#ff9933' }}>
              Important Links
            </Typography>
            <Stack spacing={1}>
              {['National Portal of India', 'Digital India', 'MyGov', 'RTI'].map(item => (
                <Link key={item} href="#" color="inherit" underline="hover" sx={{ opacity: 0.8, fontSize: '0.9rem' }}>
                  {item}
                </Link>
              ))}
            </Stack>
          </Box>

          {/* Column 4: Policies */}
          <Box sx={{ flex: '1 1 200px' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#ff9933' }}>
              Website Policies
            </Typography>
            <Stack spacing={1}>
              {['Terms of Use', 'Privacy Policy', 'Copyright Policy', 'Hyperlinking Policy', 'Accessibility Statement'].map(item => (
                <Link key={item} href="#" color="inherit" underline="hover" sx={{ opacity: 0.8, fontSize: '0.9rem' }}>
                  {item}
                </Link>
              ))}
            </Stack>
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 3 }} />

        {/* Bottom Footer */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
            Website Content Managed by Government of India
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Designed, Developed and Hosted by <span style={{ fontWeight: 'bold', color: '#fff' }}>National Informatics Centre (NIC)</span>
          </Typography>
          <Box sx={{ mt: 2 }}>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/9/91/National_Informatics_Centre_%28NIC%29_logo.png"
              alt="NIC Logo"
              style={{ height: 30, opacity: 0.8, filter: 'invert(1) brightness(100)' }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default GovFooter;
