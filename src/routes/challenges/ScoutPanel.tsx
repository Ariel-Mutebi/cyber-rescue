import { Box, Typography } from '@mui/material'
import type { FunctionReturnType } from 'convex/server'
import { api } from '../../../convex/_generated/api'
import Window from '../../components/Window'

type ScoutChallenge = Extract<
  Extract<FunctionReturnType<typeof api.challenges.getCurrent>, { status: 'active' }>['challenge'],
  { role: 'scout' }
>

export default function ScoutPanel({ challenge }: { challenge: ScoutChallenge }) {
  return (
    <Window title={challenge.scout.title || 'Evidence'} sx={{ minHeight: 0 }}>
      <Typography sx={{ whiteSpace: 'pre-wrap' }}>
        {challenge.scout.body ?? 'No evidence provided.'}
      </Typography>
      {challenge.scout.fileId && (
        <Box sx={{ mt: 2, color: 'text.secondary', fontStyle: 'italic' }}>
          (File attachment support coming soon)
        </Box>
      )}
    </Window>
  )
}
