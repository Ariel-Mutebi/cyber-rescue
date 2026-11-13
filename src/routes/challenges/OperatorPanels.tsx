import { Chip, Stack } from '@mui/material'
import { MuiMarkdown } from 'mui-markdown'
import type { Id } from '../../../convex/_generated/dataModel'
import Window from '../../components/Window'
import Terminal from './Terminal'
import type { ActiveChallenge } from './ActiveChallenge'

interface OperatorProps {
  teamChallengeId: Id<'teamChallenges'>
  challenge: Extract<ActiveChallenge, { role: 'operator' }>
}


export default function OperatorPanels({ challenge }: OperatorProps) {
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
        title={challenge.operator.title}
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
        <MuiMarkdown>
          {challenge.operator.body}
        </MuiMarkdown>
      </Window>
    </Stack>
  )
}
