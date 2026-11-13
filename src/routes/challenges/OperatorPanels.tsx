// src/pages/events/challenge/OperatorPanels.tsx
import { Chip, Stack, Typography } from '@mui/material'
import type { FunctionReturnType } from 'convex/server'
import type { Id } from '../../../convex/_generated/dataModel'
import { api } from '../../../convex/_generated/api'
import Window from '../../components/Window'
import Terminal from '../../components/Terminal'

type OperatorChallenge = Extract<
  Extract<FunctionReturnType<typeof api.challenges.getCurrent>, { status: 'active' }>['challenge'],
  { role: 'operator' }
>

export default function OperatorPanels({
  challenge,
}: {
  challenge: OperatorChallenge
  teamChallengeId: Id<'teamChallenges'>
}) {
  return (
    <Stack
      spacing={2}
      sx={{
        minHeight: 0,
        display: 'grid',
        gridTemplateRows: '3fr 2fr',
        gap: 2,
      }}
    >
      <Window
        title={challenge.operator.title || 'Toolbox'}
        scroll={false}
        sx={{ minHeight: 0 }}
        contentSx={{ p: 0 }}
      >
        {/* Key forces remount when the challenge changes. */}
        <Terminal key={challenge._id} operator={challenge.operator} />
      </Window>

      <Window
        title="Briefing"
        actions={
          <Chip
            size="small"
            label={`Format: ${challenge.flagFormat}`}
            variant="outlined"
          />
        }
      >
        <Typography sx={{ whiteSpace: 'pre-wrap' }}>
          {challenge.operator.body}
        </Typography>
      </Window>
    </Stack>
  )
}
