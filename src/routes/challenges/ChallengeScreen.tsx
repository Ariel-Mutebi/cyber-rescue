import { Navigate, useParams } from 'react-router'
import { useQuery } from 'convex/react'
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { api } from '../../../convex/_generated/api'
import { useParticipantToken } from '../../lib/useParticipantToken'
import ChallengeHeader from './ChallengeHeader'
import ScoutPanel from './ScoutPanel'
import AnalystPanel from './AnalystPanel'
import OperatorPanels from './OperatorPanels'
import TeamChat from './TeamChat'

export default function ChallengeScreen() {
  const { eventId = '' } = useParams()
  const [token] = useParticipantToken(eventId)
  const current = useQuery(
    api.challenges.getCurrent,
    token === null ? 'skip' : { token },
  )

  if (token === null) return <Navigate to={`/events/${eventId}/teams`} replace />
  if (current === undefined) return <CircularProgress />

  if (current.status === 'finished') return <FinishedScreen eventId={eventId} />

  if (current.status !== 'active') {
    return <Navigate to={`/events/${eventId}/play`} replace />
  }

  const { challenge } = current

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        height: '100%',
        minHeight: 0,
      }}
    >
      <ChallengeHeader current={current} token={token} />

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' },
          gridTemplateRows: { xs: 'minmax(0, 2fr) minmax(0, 1fr)', md: '1fr' },
        }}
      >
        {challenge.role === 'scout' && <ScoutPanel challenge={challenge} />}
        {challenge.role === 'analyst' && <AnalystPanel challenge={challenge} />}
        {challenge.role === 'operator' && (
          <OperatorPanels challenge={challenge} teamChallengeId={current.teamChallengeId} />
        )}
        <TeamChat token={token} />
      </Box>
    </Box>
  )
}

function FinishedScreen({ eventId }: { eventId: string }) {
  return (
    <Stack spacing={2} sx={{ alignItems: 'center', py: 8 }}>
      <Typography variant="h4">All challenges complete</Typography>
      <Typography color="text.secondary">Your team has finished the event.</Typography>
      <Button href={`/events/${eventId}/play`} variant="contained">
        Back to lobby
      </Button>
    </Stack>
  )
}
