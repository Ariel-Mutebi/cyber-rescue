import { useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router'
import { useMutation, useQuery } from 'convex/react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { errorMessage } from '../../lib/errors'
import { useParticipantToken } from '../../lib/useParticipantToken'
import HandleForm from './HandleForm'

export default function OpenTeams() {
  const { eventId = '' } = useParams()
  const location = useLocation()

  const event = useQuery(api.events.getPublic, { eventId })
  const [token, setToken] = useParticipantToken(eventId)
  const me = useQuery(api.participants.me, token === null ? 'skip' : { token })
  const mine = useQuery(api.teams.getMine, token === null ? 'skip' : { token })

  if (event === undefined) return <CircularProgress />
  if (event === null) return <Alert severity='warning'>Event not found</Alert>
  if (event.status === 'ended') {
    return <Alert severity='info'>This event has ended.</Alert>
  }

  if (token === null || me === null) {
    return (
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant='h5'>{event.title}</Typography>
          <Typography color='text.secondary'>
            {new Date(event.scheduledAt).toLocaleString()}
          </Typography>
        </Stack>
        <HandleForm eventId={event._id} onRegistered={setToken} />
      </Stack>
    )
  }

  if (me === undefined || mine === undefined) return <CircularProgress />

  // joined (here or elsewhere): go to the team page
  if (mine !== null) return <Navigate to={`/events/${eventId}/team`} replace />

  const fullTeam = (location.state as { teamFull?: string } | null)?.teamFull

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant='h5'>{event.title}</Typography>
        <Typography color='text.secondary'>
          Playing as <strong>{me.handle}</strong>
        </Typography>
      </Stack>

      {fullTeam !== undefined && (
        <Alert severity='info'>
          "{fullTeam}" filled up before you could join. Pick another team.
        </Alert>
      )}

      <OpenTeamList eventId={event._id} token={token} />
    </Stack>
  )
}

function OpenTeamList({ eventId, token }: { eventId: Id<'events'>; token: string }) {
  const teams = useQuery(api.teams.listOpen, { eventId })
  const join = useMutation(api.teams.join)
  const [joiningId, setJoiningId] = useState<Id<'teams'> | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleJoin(teamId: Id<'teams'>) {
    setError(null)
    setJoiningId(teamId)
    try {
      const result = await join({ token, teamId })
      if (result.status === 'full') setError('That team just filled up. Pick another.')
      // on success, getMine updates and the parent redirects to the team page
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setJoiningId(null)
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant='h6'>Open teams</Typography>

      {error !== null && <Alert severity='error'>{error}</Alert>}

      {teams === undefined ? (
        <CircularProgress />
      ) : teams.length === 0 ? (
        <Typography color='text.secondary'>
          No open teams right now. New rooms appear here as soon as an organiser creates them.
        </Typography>
      ) : (
        teams.map((t) => (
          <Card key={t._id} variant='outlined'>
            <CardContent>
              <Stack direction='row' spacing={2} sx={{ alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography>{t.name}</Typography>
                </Box>
                <Chip label={`${t.memberCount}/${t.capacity}`} size='small' />
                <Button
                  variant='contained'
                  size='small'
                  disabled={joiningId !== null}
                  onClick={() => void handleJoin(t._id)}
                >
                  Join
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ))
      )}
    </Stack>
  )
}
