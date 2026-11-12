import { useParams, Navigate } from 'react-router'
import { useQuery } from 'convex/react'
import { Alert, CircularProgress, Stack, Typography } from '@mui/material'
import { api } from '../../../convex/_generated/api'
import { useParticipantToken } from '../../lib/useParticipantToken'
import TripleLock from './TripleLock'

export default function Play() {
  const { eventId = '' } = useParams()
  const event = useQuery(api.events.getPublic, { eventId })
  const [token] = useParticipantToken(eventId)
  const current = useQuery(
    api.challenges.getCurrent,
    token === null ? 'skip' : { token },
  )

  if (event === undefined || current === undefined) return <CircularProgress />
  if (event === null) return <Alert severity="warning">Event not found</Alert>
  if (token === null) return <Navigate to={`/events/${eventId}/teams`} replace />

  // If we somehow fall back to a waiting state, send them back to the lobby.
  if (
    current.status === 'no-session' ||
    current.status === 'no-team' ||
    current.status === 'waiting-for-team' ||
    current.status === 'waiting-for-event'
  ) {
    return <Navigate to={`/events/${eventId}/lobby`} replace />
  }

  if (current.status === 'ended') {
    return <SimpleScreen title="Event ended" body="Thanks for playing." />
  }

  if (current.status === 'finished') {
    return (
      <SimpleScreen
        title="You're done!"
        body="Your team has completed every challenge. Wait for the debrief."
      />
    )
  }

  if (current.status === 'triple-lock') {
    return <TripleLock current={current} token={token} />
  }

  // current.status === 'active' — build this next.
  return (
    <SimpleScreen
      title="Challenge incoming"
      body="The active challenge view isn't wired up yet."
    />
  )
}

function SimpleScreen({ title, body }: { title: string; body: string }) {
  return (
    <Stack spacing={2} sx={{ alignItems: 'center', py: 6 }}>
      <Typography variant="h4">{title}</Typography>
      <Typography color="text.secondary">{body}</Typography>
    </Stack>
  )
}
