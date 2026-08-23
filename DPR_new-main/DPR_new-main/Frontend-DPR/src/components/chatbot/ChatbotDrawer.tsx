import React, { useRef, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Paper from '@mui/material/Paper';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import Tooltip from '@mui/material/Tooltip';
import Fade from '@mui/material/Fade';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

interface ChatbotDrawerProps {
  open: boolean;
  onClose: () => void;
  messages: Message[];
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
}

const ChatbotDrawer: React.FC<ChatbotDrawerProps> = ({ open, onClose, messages, input, onInputChange, onSend }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  if (!open) return null;

  return (
    <Fade in={open} timeout={300}>
      <Paper
        elevation={24}
        sx={{
          position: 'fixed',
          bottom: 100,
          right: 32,
          zIndex: 1400,
          width: isExpanded ? 800 : 380,
          height: isExpanded ? 700 : 550,
          maxHeight: '80vh',
          maxWidth: '90vw',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
          bgcolor: '#f8f9fa',
          border: '1px solid rgba(0,0,0,0.1)'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            background: 'linear-gradient(135deg, #0f2c59 0%, #1C7293 100%)', // Brand Gradient
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36 }}>
              <SmartToyIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                InfraMind AI
              </Typography>
            </Box>
          </Box>
          <Box>
            <Tooltip title={isExpanded ? "Collapse" : "Expand"}>
              <IconButton onClick={toggleExpand} sx={{ color: 'white', mr: 1 }} size="small">
                {isExpanded ? <CloseFullscreenIcon fontSize="small" /> : <OpenInFullIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            {/* Close button can also be treated as a minimize to FAB */}
            <IconButton onClick={onClose} sx={{ color: 'white' }} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Messages */}
        <List sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {messages.length === 0 && (
            <Box sx={{ textAlign: 'center', mt: 4, opacity: 0.8, p: 2 }}>
              <Box sx={{ bgcolor: '#e3f2fd', borderRadius: '50%', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                <SmartToyIcon sx={{ fontSize: 32, color: '#0f2c59' }} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                👋 Hi! I'm InfraMind AI, your DPR assistant. <br /> How can I help you today?
              </Typography>
            </Box>
          )}

          {messages.map((msg: Message) => {
            const isUser = msg.sender === 'user';
            return (
              <ListItem
                key={msg.id}
                sx={{
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start',
                  px: 0,
                  gap: 1.5
                }}
              >
                {!isUser && (
                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#0f2c59', color: '#fff' }}>
                    <SmartToyIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                )}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    maxWidth: '75%',
                    borderRadius: 3,
                    borderTopLeftRadius: !isUser ? 0 : 3,
                    borderTopRightRadius: isUser ? 0 : 3,
                    bgcolor: isUser ? '#f0f4f8' : '#e3f2fd', // Light blue for bot
                    color: isUser ? '#0f2c59' : '#0f2c59',
                    boxShadow: 'none',
                    border: 'none'
                  }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    {msg.text}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.6, fontSize: '0.65rem', textAlign: 'right' }}>
                    20:49
                  </Typography>
                </Paper>
                {isUser && (
                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#0f2c59' }}>
                    <PersonIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                )}
              </ListItem>
            );
          })}
          <div ref={messagesEndRef} />
        </List>

        {/* Input Area */}
        <Box sx={{ p: 2, bgcolor: '#fff', borderTop: '1px solid #f0f0f0' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#f8f9fa',
              borderRadius: 30, // Pill shape
              px: 3,
              py: 1,
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              '&:focus-within': {
                borderColor: '#1C7293',
                boxShadow: '0 2px 8px rgba(28,114,147,0.1)'
              }
            }}
          >
            <TextField
              value={input}
              onChange={onInputChange}
              placeholder="Ask about your DPR..."
              fullWidth
              variant="standard"
              InputProps={{ disableUnderline: true }}
              sx={{ py: 0.5 }}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') onSend(); }}
            />

            <IconButton
              color="primary"
              onClick={onSend}
              disabled={!input.trim()}
              sx={{
                bgcolor: input.trim() ? '#0f2c59' : '#e0e0e0',
                color: 'white',
                '&:hover': {
                  bgcolor: input.trim() ? '#0a1f40' : '#e0e0e0',
                },
                ml: 1,
                width: 36,
                height: 36,
                transition: 'all 0.2s'
              }}
            >
              <SendIcon sx={{ fontSize: 18, ml: 0.5 }} />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
};

export default ChatbotDrawer;
