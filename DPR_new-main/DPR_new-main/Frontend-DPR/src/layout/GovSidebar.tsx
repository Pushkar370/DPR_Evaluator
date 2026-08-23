import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  IconButton,
  Tooltip,
  ListSubheader
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MapIcon from '@mui/icons-material/Map';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import DescriptionIcon from '@mui/icons-material/Description';
import AnalyticsIcon from '@mui/icons-material/Analytics';

const drawerWidth = 260;
const collapsedWidth = 65;

interface GovSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole: string;
}

const GovSidebar: React.FC<GovSidebarProps> = ({ collapsed, onToggle, currentPage, onNavigate, userRole }) => {

  const renderMenuItem = (id: string, text: string, icon: React.ReactNode) => (
    <Tooltip title={collapsed ? text : ''} placement="right" key={id}>
      <ListItem disablePadding sx={{ display: 'block' }}>
        <ListItemButton
          selected={currentPage === id}
          onClick={() => onNavigate(id)}
          sx={{
            minHeight: 48,
            justifyContent: collapsed ? 'center' : 'initial',
            borderLeft: currentPage === id && !collapsed ? '4px solid #0f2c59' : '4px solid transparent',
            px: 2.5,
            transition: 'all 0.2s',
            '&.Mui-selected': {
              bgcolor: 'rgba(15, 44, 89, 0.08)',
              color: '#0f2c59',
              fontWeight: 'bold',
              '& .MuiListItemIcon-root': {
                color: '#0f2c59',
              },
            },
            '&:hover': {
              bgcolor: 'rgba(15, 44, 89, 0.04)',
              transform: collapsed ? 'none' : 'translateX(5px)'
            }
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: collapsed ? 0 : 3,
              justifyContent: 'center',
              color: currentPage === id ? '#0f2c59' : '#757575'
            }}
          >
            {icon}
          </ListItemIcon>
          <ListItemText
            primary={text}
            sx={{
              opacity: collapsed ? 0 : 1,
              '& .MuiTypography-root': { fontWeight: currentPage === id ? 600 : 400 }
            }}
          />
        </ListItemButton>
      </ListItem>
    </Tooltip>
  );

  return (
    <Box
      sx={{
        width: collapsed ? collapsedWidth : drawerWidth,
        flexShrink: 0,
        bgcolor: '#ffffff',
        borderRight: '1px solid #e0e0e0',
        height: '100%',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden',
        boxShadow: collapsed ? 'none' : '4px 0 20px rgba(0,0,0,0.02)'
      }}
    >
      {/* Header Toggle */}
      <Box sx={{
        p: 2,
        bgcolor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        height: 64,
        borderBottom: '1px solid #e0e0e0'
      }}>
        {!collapsed && (
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f2c59', letterSpacing: '1px' }}>
            NAVIGATION
          </Typography>
        )}
        <IconButton onClick={onToggle} size="small" sx={{ color: '#0f2c59' }}>
          {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
        </IconButton>
      </Box>

      {/* Menu Categories */}
      <List component="nav" sx={{ flexGrow: 1, pt: 1 }}>

        {/* Section 1: Core Operations */}
        {!collapsed && (
          <ListSubheader component="div" sx={{ lineHeight: '36px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#9e9e9e' }}>
            Core Modules
          </ListSubheader>
        )}
        {renderMenuItem('dashboard', 'Dashboard', <DashboardIcon />)}
        {userRole !== 'public' && renderMenuItem('analysis', 'DPR Analysis', <AnalyticsIcon />)}

        {!collapsed && <Divider sx={{ my: 1, mx: 2, opacity: 0.6 }} />}

        {/* Section 2: Analysis & Reports */}
        {!collapsed && (
          <ListSubheader component="div" sx={{ lineHeight: '36px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#9e9e9e' }}>
            Analysis
          </ListSubheader>
        )}
        {userRole !== 'public' && renderMenuItem('geo', 'Geospatial Verification', <MapIcon />)}
        {renderMenuItem('reports', 'Reports & Analytics', <AssessmentIcon />)}
        {userRole !== 'public' && renderMenuItem('docs', 'All Documents', <DescriptionIcon />)}

        {!collapsed && <Divider sx={{ my: 1, mx: 2, opacity: 0.6 }} />}

        {/* Section 3: System */}
        {!collapsed && (
          <ListSubheader component="div" sx={{ lineHeight: '36px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#9e9e9e' }}>
            System
          </ListSubheader>
        )}
        {userRole !== 'public' && renderMenuItem('settings', 'Settings', <SettingsIcon />)}
        {renderMenuItem('help', 'Help & Support', <HelpCenterIcon />)}

      </List>

      {/* Footer Info */}
      {!collapsed && (
        <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', bgcolor: '#f8f9fa' }}>
          <Typography variant="caption" display="block" color="text.secondary" sx={{ fontWeight: 600 }}>
            CPMS v1.0.0
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Powered by NIC
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default GovSidebar;
