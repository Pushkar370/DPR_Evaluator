import { useState } from 'react';

export interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

export interface UseChatbotReturn {
  isOpen: boolean;
  messages: ChatMessage[];
  input: string;
  openChatbot: () => void;
  closeChatbot: () => void;
  setInput: (value: string) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sendMessage: () => void;
}

/**
 * Custom hook for managing chatbot state and logic
 * Separates chatbot concerns from layout components
 */
export const useChatbot = (): UseChatbotReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, text: 'Hello! How can I assist you today?', sender: 'bot' },
  ]);

  const openChatbot = () => setIsOpen(true);
  const closeChatbot = () => setIsOpen(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

const sendMessage = async () => {
    if (input.trim() === '') return;

    const currentText = input;
    const newMessage: ChatMessage = {
      id: messages.length + 1,
      text: currentText,
      sender: 'user',
    };

    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInput('');

    try {
      const storedJobId = localStorage.getItem('dpr_job_id');
      
      if (!storedJobId) {
          throw new Error("No document uploaded yet. Please upload a DPR first.");
      }

      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: storedJobId,
          query: currentText
        })
      });

      if (!response.ok) {
         throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      
      const botResponse: ChatMessage = {
        id: messages.length + 2,
        text: data.answer || "I could not find an answer.",
        sender: 'bot',
      };
      setMessages(prevMessages => [...prevMessages, botResponse]);

    } catch (error: any) {
      const errorResponse: ChatMessage = {
        id: messages.length + 2,
        text: "Error connecting to AI: " + error.message,
        sender: 'bot',
      };
      setMessages(prevMessages => [...prevMessages, errorResponse]);
    }
  };

  return {
    isOpen,
    messages,
    input,
    openChatbot,
    closeChatbot,
    setInput,
    handleInputChange,
    sendMessage,
  };
};
