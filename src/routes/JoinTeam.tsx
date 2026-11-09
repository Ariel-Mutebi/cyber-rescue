import { useState } from 'react'
import { Link as RouterLink, Navigate, useNavigate, useParams } from 'react-router'
import { useMutation, useQuery } from 'convex/react'
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import { api } from '../../convex/_generated/api'
import { errorMessage } from '../lib/errors'
import { useParticipantToken } from '../lib/useParticipantToken'
import HandleForm from './HandleForm'

export default function JoinTeam() {
  const { code = '' } = useParams()
  const navigate = useNavigate()

  const team = useQuery(api.teams.getByJoinCode, { code })
  const [token, setToken] = useParticipantToken(team?.eventId)
  const me = useQuery(api.participants.me, token === null ? 'skip' : { token })
  const mine = useQuery(api.teams.getMine, token === null ? 'skip' : { token })
  const join = useMutation(api.teams.join)

  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (team === undefined) return <CircularProgress />
  if (team === null) {
    return <Alert severity='warning'>This team link isn't valid. Ask for a new one.</Alert>
  }
  if (team.eventStatus === 'ended') {
    return <Alert severity='info'>This event has ended.</Alert>
  }

  const preview = (
    <Stack spacing={0.5}>
      <Typography variant='overline' color='text.secondary'>
        {team.eventTitle}
      </Typography>
      <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
        <Typography variant='h5'>{team.teamName}</Typography>
        <Chip size='small' label={`${team.memberCount}/${team.capacity}`} />
      </Stack>
    </Stack>
  )

  // no session yet (or a stale token): choose a handle first
  if (token === null || me === null) {
    return (
      <Stack spacing={3}>
        {preview}
        <Typography>You've been invited to join this team.</Typography>
        <HandleForm eventId={team.eventId} onRegistered={setToken} />
      </Stack>
    )
  }

  if (me === undefined || mine === undefined) return <CircularProgress />

  if (mine !== null) {
    if (mine.teamId === team.teamId) {
      return <Navigate to={`/events/${team.eventId}/team`} replace />
    }
    return (
      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Alert severity='info'>You're already in "{mine.name}".</Alert>
        <Button component={RouterLink} to={`/events/${team.eventId}/team`}>
          Go to my team
        </Button>
      </Stack>
    )
  }

  if (team.memberCount >= team.capacity) {
    return (
      <Navigate
        to={`/events/${team.eventId}/teams`}
        replace
        state={{ teamFull: team.teamName }}
      />
    )
  }

  const handleJoin = async () => {
    setError(null)
    setJoining(true)
    try {
      const result = await join({ token, teamId: team.teamId })
      if (result.status === 'full') {
        navigate(`/events/${team.eventId}/teams`, { state: { teamFull: team.teamName } })
      }
      // on success, getMine updates and the redirect above opens the team page
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setJoining(false)
    }
  }

  return (
    <Stack spacing={3}>
      {preview}
      {error !== null && <Alert severity='error'>{error}</Alert>}
      <Typography>
        You'll join as <strong>{me.handle}</strong>.
      </Typography>
      <Button
        variant='contained'
        size='large'
        disabled={joining}
        startIcon={joining ? <CircularProgress size={18} /> : undefined}
        onClick={() => void handleJoin()}
      >
        Join team
      </Button>
    </Stack>
  )
}
