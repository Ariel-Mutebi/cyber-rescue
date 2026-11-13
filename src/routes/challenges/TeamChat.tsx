import { useState, type SubmitEvent } from 'react'
import { useMutation, useQuery } from 'convex/react'
import {
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import MicIcon from '@mui/icons-material/Mic'
import Window from '../../components/Window'
import { api } from '../../../convex/_generated/api'

export default function TeamChat({ token }: { token: string }) {
  const messages = useQuery(api.messages.list, { token })
  const send = useMutation(api.messages.send)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const body = text.trim()
    if (body === '' || sending) return
    setSending(true)
    setText('')
    try {
      await send({ token, body })
    } catch {
      setText(body) // restore on failure
    } finally {
      setSending(false)
    }
  }

  return (
    <Window
      title="Team chat"
      actions={
        <Tooltip title="Voice — coming soon">
          <span>
            <IconButton size="small" disabled>
              <MicIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      }
      sx={{ minHeight: 0 }}
      contentSx={{ p: 0, display: 'flex', flexDirection: 'column' }}
    >
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 2 }}>
        {messages === undefined ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CircularProgress size={20} />
          </Box>
        ) : messages === null ? (
          <Typography color="text.secondary">Join a team to chat.</Typography>
        ) : messages.length === 0 ? (
          <Typography color="text.secondary">No messages yet.</Typography>
        ) : (
          <Stack spacing={1}>
            {messages.map((m) => (
              <Box key={m._id}>
                <Typography
                  variant="caption"
                  sx={{
                    color: m.isMe ? 'primary.main' : 'text.secondary',
                    fontWeight: m.isMe ? 600 : 400,
                  }}
                >
                  {m.handle}
                  {m.kind === 'manager' && ' (manager)'}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {m.body}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}
      >
        <TextField
          size="small"
          fullWidth
          placeholder="Message your team…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={sending}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="submit"
                    size="small"
                    disabled={text.trim() === '' || sending}
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
    </Window>
  )
}
