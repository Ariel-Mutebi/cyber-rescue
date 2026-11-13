import { Box } from '@mui/material'
import { MuiMarkdown } from 'mui-markdown'
import type { FunctionReturnType } from 'convex/server'
import { api } from '../../../convex/_generated/api'
import Window from '../../components/Window'

type ScoutChallenge = Extract<
  Extract<FunctionReturnType<typeof api.challenges.getCurrent>, { status: 'active' }>['challenge'],
  { role: 'scout' }
>

export default function ScoutPanel({ challenge }: { challenge: ScoutChallenge }) {
  return (
    <Window title={challenge.scout.title} sx={{ minHeight: 0 }}>
      <MuiMarkdown>
        {challenge.scout.body ?? 'No evidence provided.'}
      </MuiMarkdown>
      {challenge.scout.fileId && (
        <Box sx={{ mt: 2, color: 'text.secondary', fontStyle: 'italic' }}>
          (File attachment support coming soon)
        </Box>
      )}
    </Window>
  )
}
