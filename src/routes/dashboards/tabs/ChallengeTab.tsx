import { useState } from 'react'
import { Box, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import { useQuery } from 'convex/react'
import { useOutletContext } from 'react-router'
import type { Id } from '../../../../convex/_generated/dataModel'
import { api } from '../../../../convex/_generated/api'
import ChallengeFormDialog from './ChallengeForm'
import type { EventTabContext } from './TeamsTab'

const DIFFICULTY = {
  1: { label: 'Easy', color: 'success' },
  2: { label: 'Medium', color: 'warning' },
  3: { label: 'Hard', color: 'error' },
} as const

export default function ChallengesTab() {
  const { event } = useOutletContext<EventTabContext>()
  const challenges = useQuery(api.challenges.listForEvent, { eventId: event._id })
  const [editing, setEditing] = useState<Id<'challenges'> | 'new' | null>(null)

  if (challenges === undefined) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (challenges === null) {
    return (
      <Typography sx={{ color: 'text.secondary' }}>
        You don't have access to this event.
      </Typography>
    )
  }

  // The back end only allows adding and editing while the event is scheduled.
  const locked = event.status !== 'scheduled'
  const totalPoints = challenges.reduce((sum, c) => sum + c.points, 0)

  return (
    <Stack spacing={3}>
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h6">Challenges</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {challenges.length} {challenges.length === 1 ? 'challenge' : 'challenges'} ·{' '}
            {totalPoints} points
            {locked && ' · locked once the event has started'}
          </Typography>
        </Box>
        <Button variant="contained" disabled={locked} onClick={() => setEditing('new')}>
          New challenge
        </Button>
      </Stack>

      {challenges.length === 0 ? (
        <Typography sx={{ color: 'text.secondary' }}>
          No challenges yet. Add at least one before starting the event.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {challenges.map((c, i) => {
            const difficulty = DIFFICULTY[c.difficulty]
            return (
              <Stack
                key={c._id}
                direction="row"
                spacing={2}
                role="button"
                tabIndex={locked ? -1 : 0}
                onClick={() => {
                  if (!locked) setEditing(c._id)
                }}
                onKeyDown={(e) => {
                  if (!locked && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    setEditing(c._id)
                  }
                }}
                sx={{
                  alignItems: 'center',
                  p: 1.5,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  ...(!locked && {
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }),
                }}
              >
                <Typography sx={{ width: 24, color: 'text.secondary' }}>
                  {i + 1}
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography>{c.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {c.points} points
                  </Typography>
                </Box>
                <Chip size="small" label={difficulty.label} color={difficulty.color} />
                <Button
                  disabled={locked}
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditing(c._id)
                  }}
                >
                  Edit
                </Button>
              </Stack>
            )
          })}
        </Stack>
      )}

      {editing !== null && (
        <ChallengeFormDialog
          eventId={event._id}
          onClose={() => setEditing(null)}
          challengeId={editing === 'new' ? undefined : editing}
        />
      )}
    </Stack>
  )
}
