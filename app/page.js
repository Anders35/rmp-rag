'use client'
import { Box, Button, Stack, TextField, useTheme, ThemeProvider, createTheme, Typography, InputAdornment } from '@mui/material'
import { useState, useMemo } from 'react'
import { Brightness4, Brightness7, Send, Chat } from '@mui/icons-material'

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm the Rate My Professor support assistant. How can I help you today?`,
    },
  ])
  const [message, setMessage] = useState('')
  const [mode, setMode] = useState('light')

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
        components: {
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                borderRadius: 8,
              },
            },
          },
        },
      }),
    [mode],
  )

  const sendMessage = async () => {
    setMessage('')
    setMessages((messages) => [
      ...messages,
      {role: 'user', content: message},
      {role: 'assistant', content: ''},
    ])
  
    const response = fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([...messages, {role: 'user', content: message}]),
    }).then(async (res) => {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let result = ''
  
      return reader.read().then(function processText({done, value}) {
        if (done) {
          return result
        }
        const text = decoder.decode(value || new Uint8Array(), {stream: true})
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            {...lastMessage, content: lastMessage.content + text},
          ]
        })
        return reader.read().then(processText)
      })
    })
  }

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        bgcolor={theme.palette.background.default}
        color={theme.palette.text.primary}
      >
        <Stack
          direction={'column'}
          width="90%"
          maxWidth="600px"
          height="80vh"
          border={`1px solid ${theme.palette.divider}`}
          borderRadius={4}
          p={3}
          spacing={3}
          bgcolor={theme.palette.background.paper}
          boxShadow={3}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" component="h1" fontWeight="bold">
              <Chat sx={{ mr: 1, verticalAlign: 'middle' }} />
              Rate My Professor Chat
            </Typography>
            <Button onClick={toggleColorMode} color="inherit">
              {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </Button>
          </Box>
          <Stack
            direction={'column'}
            spacing={2}
            flexGrow={1}
            overflow="auto"
            maxHeight="100%"
            sx={{
              '&::-webkit-scrollbar': {
                width: '0.4em',
              },
              '&::-webkit-scrollbar-track': {
                boxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
                webkitBoxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,.1)',
                outline: '1px solid slategrey',
              },
            }}
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
                      ? theme.palette.primary.main
                      : theme.palette.secondary.main
                  }
                  color={theme.palette.getContrastText(
                    message.role === 'assistant'
                      ? theme.palette.primary.main
                      : theme.palette.secondary.main
                  )}
                  borderRadius={4}
                  p={2}
                  maxWidth="70%"
                >
                  {message.content}
                </Box>
              </Box>
            ))}
          </Stack>
          <Stack direction={'row'} spacing={2} alignItems="center">
            <TextField
              label="Message"
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  paddingRight: '14px',
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      variant="contained"
                      onClick={sendMessage}
                      sx={{
                        minWidth: '40px',
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        padding: 0,
                      }}
                    >
                      <Send />
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </Stack>
      </Box>
    </ThemeProvider>
  )
}