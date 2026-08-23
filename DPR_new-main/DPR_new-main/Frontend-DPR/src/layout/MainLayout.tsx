import React, { ReactNode, useState } from 'react';
import ChatbotButton from '../components/chatbot/ChatbotButton';
import ChatbotDrawer from '../components/chatbot/ChatbotDrawer';
import GovHeader from './GovHeader';
import GovSidebar from './GovSidebar';
import GovFooter from './GovFooter';
import Box from '@mui/material/Box';
import { useChatbot } from '../hooks';

import { useLocation, useNavigate } from 'react-router-dom';

interface MainLayoutProps {
  children: ReactNode;
  userRole: string;
}

// Map URL paths to sidebar IDs
const pathToSidebarId: Record<string, string> = {
  '': 'dashboard',
  'dashboard': 'dashboard',
  'upload': 'upload',
  'analysis': 'analysis',
  'geo-verification': 'geo',
  'reports': 'reports',
  'documents': 'docs',
  'settings': 'settings',
  'profile': 'profile',
  'help': 'help',
};

// Map sidebar IDs to URL paths
const sidebarIdToPath: Record<string, string> = {
  'dashboard': 'dashboard',
  'upload': 'upload',
  'analysis': 'analysis',
  'geo': 'geo-verification',
  'reports': 'reports',
  'docs': 'documents',
  'settings': 'settings',
  'profile': 'profile',
  'help': 'help',
};

const MainLayout: React.FC<MainLayoutProps> = ({ children, userRole }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const chatbot = useChatbot();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSidebarToggle = () => setSidebarCollapsed(!sidebarCollapsed);

  const pathSegment = location.pathname.substring(1) || 'dashboard';
  const currentPage = pathToSidebarId[pathSegment] || pathSegment;

  const handleNavigate = (sidebarId: string) => {
    const path = sidebarIdToPath[sidebarId] || sidebarId;
    navigate(`/${path}`);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8f9fa' }}>
      <GovHeader onNavigate={handleNavigate} />

      {/* Content Area with Sidebar */}
      <Box sx={{ display: 'flex', flex: 1 }}>
        <GovSidebar
          collapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
          currentPage={currentPage}
          onNavigate={handleNavigate}
          userRole={userRole}
        />

        <Box
          component="main"
          sx={{
            flex: 1,
            py: 4,
            px: 3,
            minHeight: '60vh',
            maxWidth: sidebarCollapsed ? 'calc(100vw - 65px)' : 'calc(100vw - 260px)', // Adjust width
            transition: 'max-width 0.3s ease',
            overflowX: 'hidden'
          }}
        >
          {children}
        </Box>
      </Box>

      <GovFooter />

      <ChatbotButton onClick={chatbot.openChatbot} />
      <ChatbotDrawer
        open={chatbot.isOpen}
        onClose={chatbot.closeChatbot}
        messages={chatbot.messages}
        input={chatbot.input}
        onInputChange={chatbot.handleInputChange}
        onSend={chatbot.sendMessage}
      />
    </Box>
  );
};

export default MainLayout;
