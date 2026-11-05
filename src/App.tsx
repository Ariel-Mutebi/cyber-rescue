import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'
import {
  Container,
  Stack,
  TextField,
  IconButton,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Avatar,
  Box,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import PersonIcon from '@mui/icons-material/Person'
import SecurityIcon from '@mui/icons-material/Security'

export default function App() {
  const messages = useQuery(api.messages.list)
  const send = useMutation(api.messages.send)
  const [body, setBody] = useState('')
  const [author, setAuthor] = useState('')

  const canSend = body.trim() !== '' && author.trim() !== ''

  return (
    <Container maxWidth='sm' sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
          <SecurityIcon color='primary' />
          <Typography variant='h5'>Cyber Rescue</Typography>
        </Stack>

        <Stack
          component='form'
          spacing={1}
          onSubmit={async (e) => {
            e.preventDefault()
            if (!canSend) return
            await send({ body, author })
            setBody('')
          }}
        >
          <TextField
            label='Your name'
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            size='small'
          />
          <Stack direction='row' spacing={1}>
            <TextField
              label='Message'
              value={body}
              onChange={(e) => setBody(e.target.value)}
              fullWidth
            />
            <IconButton
              type='submit'
              color='primary'
              aria-label='send'
              disabled={!canSend}
            >
              <SendIcon />
            </IconButton>
          </Stack>
        </Stack>

        {messages === undefined ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          messages.map((m) => (
            <Card key={m._id}>
              <CardContent>
                <Stack direction='row' spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    <PersonIcon fontSize='small' />
                  </Avatar>
                  <Box>
                    <Typography variant='subtitle2'>{m.author}</Typography>
                    <Typography>{m.body}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>
    </Container>
  )
}
