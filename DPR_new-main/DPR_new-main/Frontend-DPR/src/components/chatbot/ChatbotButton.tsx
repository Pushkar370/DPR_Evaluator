import React from 'react';
import Fab from '@mui/material/Fab';
import ChatIcon from '@mui/icons-material/Chat'; // Or SmartToy if preferred
import Tooltip from '@mui/material/Tooltip';

interface ChatbotButtonProps {
  onClick: () => void;
}

const ChatbotButton: React.FC<ChatbotButtonProps> = ({ onClick }) => (
  <Tooltip title="Ask InfraMind" placement="left">
    <Fab
      color="primary" // Changed to primary to match the theme
      aria-label="Ask InfraMind"
      onClick={onClick}
      sx={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 1300,
        bgcolor: '#0f2c59', // Explicitly match brand color
        '&:hover': {
          bgcolor: '#1C7293',
        }
      }}
    >
      <ChatIcon />
    </Fab>
  </Tooltip>
);

export default ChatbotButton;
