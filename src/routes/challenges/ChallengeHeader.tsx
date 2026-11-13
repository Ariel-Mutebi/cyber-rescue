import { useState } from 'react'
import { Button, Chip, Paper, Stack, Typography } from '@mui/material'
import type { FunctionReturnType } from 'convex/server'
import { api } from '../../../convex/_generated/api'
import FlagDialog from './FlagDialog'
import HintsDialog from './HintsDialog'

type Current = Extract<
  FunctionReturnType<typeof api.challenges.getCurrent>,
  { status: 'active' }
>

export default function ChallengeHeader({
  current,
  token,
}: {
  current: Current
  token: string
}) {
  const [flagOpen, setFlagOpen] = useState(false)
  const [hintsOpen, setHintsOpen] = useState(false)
  const { challenge, hintsUsed } = current

  const availableHints = challenge.hints.length
  const showHintBadge = hintsUsed < availableHints

  return (
    <Paper elevation={4} sx={{ p: 2, borderRadius: 2 }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            {challenge.title}
          </Typography>
          <Chip size="small" label={`${challenge.points} pts`} />
          <Button size="small" onClick={() => setHintsOpen(true)}>
            Hints {showHintBadge && `(${hintsUsed}/${availableHints})`}
          </Button>
          <Button size="small" variant="contained" onClick={() => setFlagOpen(true)}>
            Submit flag
          </Button>
        </Stack>
        {challenge.story && (
          <Typography variant="body2" color="text.secondary">
            {challenge.story}
          </Typography>
        )}
      </Stack>

      <FlagDialog
        open={flagOpen}
        onClose={() => setFlagOpen(false)}
        token={token}
        challengeId={challenge._id}
        flagFormat={challenge.flagFormat}
      />
      <HintsDialog
        open={hintsOpen}
        onClose={() => setHintsOpen(false)}
        token={token}
        current={current}
      />
    </Paper>
  )
}
