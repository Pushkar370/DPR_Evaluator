import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
  IconButton,
  Stack,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

interface GovHeaderProps {
  onNavigate?: (page: string) => void;
}

const GovHeader: React.FC<GovHeaderProps> = ({ onNavigate }) => {
  // Profile Menu State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Notification Menu State
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const notifOpen = Boolean(notifAnchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotifClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    // TODO: Implement actual logout logic
    console.log('User logged out');
  };

  return (
    <AppBar position="sticky" sx={{ bgcolor: '#0B3C5D', boxShadow: 3 }}>
      <Box sx={{ px: { xs: 2, md: 3 }, width: '100%', boxSizing: 'border-box' }}>
        <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 70 } }}>

          {/* Left: Emblem & Branding */}
          <Stack direction="row" spacing={2} alignItems="center">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
              alt="State Emblem of India"
              style={{ height: 45, width: 'auto', filter: 'brightness(0) invert(1)' }} // White emblem
            />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.1, fontSize: '0.75rem', color: '#fff' }}>
                भारत सरकार
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1, color: '#fff', fontSize: '1.1rem' }}>
                Government of India
              </Typography>
            </Box>
          </Stack>

          {/* Spacer to push content to right */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Right: App Controls */}
          <Stack direction="row" spacing={3} alignItems="center">

            {/* Google Translate Widget */}
            <Box sx={{
              '& .goog-te-gadget-simple': {
                backgroundColor: 'transparent',
                border: 'none',
                padding: 0,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center'
              },
              '& .goog-te-gadget-icon': {
                display: 'none'
              },
              '& .goog-te-menu-value': {
                color: '#0f2c59',
                fontWeight: 500
              }
            }}>
              <div id="google_translate_element"></div>
            </Box>

            {/* Digital India Logo */}
            <Box sx={{ display: { xs: 'none', md: 'block' }, mr: 2 }}>
              <img
                src="/digital-india-logo.png"
                alt="Digital India"
                style={{ height: 40, background: 'white', borderRadius: 4, padding: 2 }}
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </Box>

            {/* Notifications */}
            <Box>
              <Tooltip title="Notifications">
                <IconButton
                  color="inherit"
                  onClick={handleNotifClick}
                  aria-controls={notifOpen ? 'notification-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={notifOpen ? 'true' : undefined}
                >
                  <Badge badgeContent={3} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Menu
                id="notification-menu"
                anchorEl={notifAnchorEl}
                open={notifOpen}
                onClose={handleNotifClose}
                onClick={handleNotifClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    width: 320,
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Typography variant="subtitle1" sx={{ px: 2, py: 1, fontWeight: 'bold', borderBottom: '1px solid #eee' }}>
                  Notifications (3)
                </Typography>
                <List dense disablePadding>
                  <ListItem button>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Analysis Completed"
                      secondary="Road_Project_Assam.pdf processed successfully."
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                    />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem button>
                    <ListItemIcon>
                      <WarningIcon color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Action Required"
                      secondary="Missing compliance docs for ID: DPR-2023-005"
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                    />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem button>
                    <ListItemIcon>
                      <InfoIcon color="info" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="System Maintenance"
                      secondary="Scheduled downtime at 2:00 AM IST."
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                    />
                  </ListItem>
                </List>
                <Box sx={{ p: 1, borderTop: '1px solid #eee', textAlign: 'center' }}>
                  <Typography variant="caption" color="primary" sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    View All Notifications
                  </Typography>
                </Box>
              </Menu>
            </Box>

            {/* User Profile */}
            <Box>
              <IconButton
                onClick={handleMenuClick}
                size="small"
                sx={{ ml: 2 }}
                aria-controls={open ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
              >
                <Avatar sx={{ width: 40, height: 40, bgcolor: '#ff9933', color: '#fff', fontWeight: 'bold' }}>
                  DA
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleMenuClose}
                onClick={handleMenuClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                    '& .MuiAvatar-root': {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={() => { handleMenuClose(); onNavigate?.('profile'); }}>
                  <AccountCircleIcon fontSize="small" sx={{ mr: 1.5 }} /> Profile
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} /> Logout
                </MenuItem>
              </Menu>
            </Box>

          </Stack>
        </Toolbar>
      </Box>
    </AppBar>
  );
};

export default GovHeader;
