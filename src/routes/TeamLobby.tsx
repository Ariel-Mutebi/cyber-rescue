import { useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { useQuery } from 'convex/react'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { api } from '../../convex/_generated/api'
import { useParticipantToken } from '../lib/useParticipantToken'

const ROLE_INFO: Record<string, string> = {
  scout: 'You get the raw data for each problem.',
  analyst: 'You get the problem description.',
  operator: 'You get the in-browser terminal and commands.',
}

export default function TeamLobby() {
  const { eventId = '' } = useParams()
  const event = useQuery(api.events.getPublic, { eventId })
  const [token] = useParticipantToken(eventId)
  const mine = useQuery(api.teams.getMine, token === null ? 'skip' : { token })

  if (event === undefined) return <CircularProgress />
  if (event === null) return <Alert severity='warning'>Event not found</Alert>

  // no session, or no team yet: back to the open-teams list
  if (token === null) return <Navigate to={`/events/${eventId}/teams`} replace />
  if (mine === undefined) return <CircularProgress />
  if (mine === null) return <Navigate to={`/events/${eventId}/teams`} replace />

  const emptySeats = mine.capacity - mine.teammates.length

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant='overline' color='text.secondary'>
          {event.title}
        </Typography>
        <Typography variant='h5'>{mine.name}</Typography>
      </Stack>

      <Card variant='outlined'>
        <CardContent>
          <Typography variant='overline' color='text.secondary'>
            Your role
          </Typography>
          <Typography variant='h5' sx={{ textTransform: 'capitalize' }}>
            {mine.myRole}
          </Typography>
          <Typography color='text.secondary'>{ROLE_INFO[mine.myRole]}</Typography>
          <Typography variant='body2' color='text.secondary' sx={{ pt: 1 }}>
            Roles rotate after every challenge.
          </Typography>
        </CardContent>
      </Card>

      <Stack spacing={1}>
        <Typography variant='subtitle2'>
          Team ({mine.teammates.length}/{mine.capacity})
        </Typography>
        {mine.teammates.map((m) => (
          <Stack
            key={m.participantId}
            direction='row'
            spacing={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography sx={{ flexGrow: 1 }}>
              {m.handle}
              {m.isMe && ' (you)'}
            </Typography>
            <Chip label={m.role} size='small' sx={{ textTransform: 'capitalize' }} />
          </Stack>
        ))}
        {Array.from({ length: emptySeats }, (_, i) => (
          <Typography key={`empty-${i}`} color='text.secondary'>
            Waiting for a teammate…
          </Typography>
        ))}
      </Stack>

      {emptySeats === 0 ? (
        <Alert severity='success'>Your team is full. Waiting for the event to start.</Alert>
      ) : (
        <InviteLink joinCode={mine.joinCode} />
      )}
    </Stack>
  )
}

function InviteLink({ joinCode }: { joinCode: string }) {
  const link = `${window.location.origin}/join/${joinCode}`
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // the field selects on focus, so manual copy still works
    }
  }

  return (
    <Stack spacing={1}>
      <Typography variant='subtitle2'>Invite teammates</Typography>
      <TextField
        value={link}
        size='small'
        fullWidth
        onFocus={(e) => e.target.select()}
        slotProps={{
          input: {
            readOnly: true,
            endAdornment: (
              <InputAdornment position='end'>
                <Button
                  size='small'
                  startIcon={<ContentCopyIcon />}
                  onClick={() => void copy()}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </InputAdornment>
            ),
          },
        }}
      />
    </Stack>
  )
}
