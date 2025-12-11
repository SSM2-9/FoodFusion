'use client';

import { Box, Button, Stack, TextField, Tooltip } from '@mui/material';
import { useEffect, useState, useRef } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi there! Describe what you would like to have today in detail, and I'll provide a delicious recipe!" },
  ]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true);
    setMessage('');
  
    const newMessages = [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ];
    setMessages(newMessages);
  
    try {
      const response = await fetch("/api/chat", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMessages),
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const data = await response.json();
      console.log('Response Data:', data);
  
      const text = data.response || "No content returned";
  
      setMessages((messages) => {
        let lastMessage = messages[messages.length - 1];
        let otherMessages = messages.slice(0, messages.length - 1);
        return [
          ...otherMessages,
          { ...lastMessage, content: text },
        ];
      });
  
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      sx={{
        backgroundImage: 'url(/Recipe.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backgroundBlendMode: 'overlay',
      }}
    >
      <Stack
        direction={'column'}
        width="100%"
        height="100%"
        p={2}
        spacing={3}
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? 'rgb(5, 165, 82)' 
                    : 'rgb(0, 130, 198)'
                }
                className="poppins-regular"
                color="white"
                borderRadius={16}
                p={3}
                sx={{ whiteSpace: 'pre-wrap' }}
              >
                {message.content}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        <Stack direction={'row'} spacing={2}>
          <TextField 
            label="Send your Message here"
            variant="filled"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              '& .MuiInputBase-input': {
                color: 'rgb(24, 24, 51)',
                fontFamily: 'Poppins, sans-serif',
              },
              '& .MuiFormLabel-root': {
                color: 'rgb(24, 24, 51)',
              },
              '& .MuiInputBase-root': {
                borderRadius: 2,
              },
            }}
          />
          <Tooltip title="Send" arrow>
            <Button
              variant="contained"
              color="primary"
              onClick={sendMessage}
              disabled={isLoading}
              sx={{
                height: '56px',
                borderRadius: 2,
              }}
            >
              {isLoading ? 'Starting...' : 'Send'}
            </Button>
          </Tooltip>
        </Stack>
      </Stack>
    </Box>
  );
}