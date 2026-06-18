import React, { useRef, useState } from 'react'
import {
  Box, TextField, Button, Paper, Typography, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Divider, IconButton, Tooltip,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import PersonIcon from '@mui/icons-material/Person'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useMutation } from '@tanstack/react-query'
import { chat } from '../api/ai'
import PageHeader from '../components/PageHeader'
import type { AiChatResponse } from '../types'

interface Message {
  id: number
  role: 'user' | 'ai'
  text?: string
  response?: AiChatResponse
  error?: string
}

const EXAMPLE_QUERIES = [
  'Show products below minimum stock.',
  'Which product has the most movements?',
  'List all OUT movements from this week.',
  'How many anomalies were flagged last month?',
]

const AiChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [query, setQuery] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const msgIdRef = useRef(0)

  const chatMut = useMutation({
    mutationFn: chat,
    onSuccess: (data) => {
      setMessages(prev => [...prev, { id: ++msgIdRef.current, role: 'ai', response: data }])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    },
    onError: () => {
      setMessages(prev => [...prev, { id: ++msgIdRef.current, role: 'ai', error: 'AI service unavailable.' }])
    },
  })

  const send = () => {
    if (!query.trim() || chatMut.isPending) return
    const q = query.trim()
    setQuery('')
    setMessages(prev => [...prev, { id: ++msgIdRef.current, role: 'user', text: q }])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    chatMut.mutate(q)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      <PageHeader
        title="AI Chat"
        subtitle="Ask questions about your inventory in natural language"
        action={messages.length > 0
          ? <Button id="clear-chat-btn" size="small" startIcon={<DeleteOutlineIcon />} onClick={() => setMessages([])}>Clear</Button>
          : undefined}
      />

      {/* Messages area */}
      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1, pb: 2 }}>
        {messages.length === 0 && (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <SmartToyIcon sx={{ fontSize: 64, color: 'primary.main', opacity: 0.5, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>Ask anything about your inventory</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 3 }}>
              {EXAMPLE_QUERIES.map(q => (
                <Chip key={q} label={q} variant="outlined" clickable onClick={() => { setQuery(q) }}
                  sx={{ borderColor: 'rgba(0,230,118,0.3)', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}
                />
              ))}
            </Box>
          </Box>
        )}

        {messages.map(msg => (
          <Box key={msg.id} sx={{ display: 'flex', gap: 1.5, mb: 2, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
            <Box sx={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, bgcolor: msg.role === 'user' ? 'primary.main' : 'rgba(88,166,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {msg.role === 'user' ? <PersonIcon sx={{ fontSize: 18, color: '#000' }} /> : <SmartToyIcon sx={{ fontSize: 18, color: '#58a6ff' }} />}
            </Box>
            <Box sx={{ maxWidth: '80%' }}>
              {msg.role === 'user' && (
                <Paper sx={{ px: 2, py: 1.5, borderRadius: '12px 4px 12px 12px', bgcolor: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)' }}>
                  <Typography variant="body2">{msg.text}</Typography>
                </Paper>
              )}
              {msg.role === 'ai' && (
                <Paper sx={{ px: 2, py: 1.5, borderRadius: '4px 12px 12px 12px' }}>
                  {msg.error && <Typography variant="body2" color="error.main">{msg.error}</Typography>}
                  {msg.response && (
                    <>
                      <Typography variant="body2" sx={{ mb: 1 }}>{msg.response.answer}</Typography>
                      {msg.response.sql_executed && (
                        <Box sx={{ mb: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">SQL</Typography>
                            <Tooltip title="Copy">
                              <IconButton size="small" onClick={() => navigator.clipboard.writeText(msg.response!.sql_executed)}>
                                <ContentCopyIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          <Box component="pre" sx={{ m: 0, p: 1.5, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 1.5, overflowX: 'auto', fontSize: '0.75rem', fontFamily: 'monospace', color: '#00e676' }}>
                            {msg.response.sql_executed}
                          </Box>
                        </Box>
                      )}
                      {msg.response.data?.length > 0 && (
                        <>
                          <Divider sx={{ mb: 1 }} />
                          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            <Typography variant="caption" color="text.secondary">{msg.response.row_count} row{msg.response.row_count !== 1 ? 's' : ''}</Typography>
                            {msg.response.truncated && <Chip label="Truncated" size="small" color="warning" variant="outlined" />}
                          </Box>
                          <TableContainer sx={{ maxHeight: 260 }}>
                            <Table size="small" stickyHeader>
                              <TableHead>
                                <TableRow>{Object.keys(msg.response.data[0]).map(col => <TableCell key={col}>{col}</TableCell>)}</TableRow>
                              </TableHead>
                              <TableBody>
                                {msg.response.data.map((row, i) => (
                                  <TableRow key={i}>{Object.values(row).map((v, j) => <TableCell key={j}>{String(v ?? '—')}</TableCell>)}</TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </>
                      )}
                      {msg.response.data?.length === 0 && <Typography variant="caption" color="text.secondary">No results returned.</Typography>}
                    </>
                  )}
                </Paper>
              )}
            </Box>
          </Box>
        ))}

        {chatMut.isPending && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: 'rgba(88,166,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={16} sx={{ color: '#58a6ff' }} />
            </Box>
            <Paper sx={{ px: 2, py: 1.5, borderRadius: '4px 12px 12px 12px' }}>
              <Typography variant="caption" color="text.secondary">Thinking…</Typography>
            </Paper>
          </Box>
        )}
        <div ref={bottomRef} />
      </Box>

      {/* Input bar */}
      <Paper sx={{ p: 1.5, borderRadius: 3, mt: 1, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField
          id="ai-chat-input" value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Ask about your inventory… (Enter to send)"
          fullWidth multiline maxRows={4} variant="standard"
          InputProps={{ disableUnderline: true, sx: { px: 1 } }}
          disabled={chatMut.isPending}
        />
        <Button id="ai-chat-send" variant="contained" onClick={send} disabled={!query.trim() || chatMut.isPending}
          sx={{ minWidth: 44, width: 44, height: 44, borderRadius: 2, p: 0 }}>
          <SendIcon />
        </Button>
      </Paper>
    </Box>
  )
}

export default AiChatPage
