import { Box } from '@mui/material'
import { MuiMarkdown } from 'mui-markdown'
import Window from '../../components/Window'
import type { ActiveChallenge } from './ActiveChallenge'

interface ScoutProps {
  challenge: Extract<ActiveChallenge, { role: 'scout' }>
}

export default function ScoutPanel({ challenge }: ScoutProps) {
  return (
    <Window title={challenge.scout.title} sx={{ minHeight: 0 }}>
      <MuiMarkdown>
        {challenge.scout.body}
      </MuiMarkdown>
      {challenge.scout.fileId && (
        <Box sx={{ mt: 2, color: 'text.secondary', fontStyle: 'italic' }}>
          (File attachment support coming soon)
        </Box>
      )}
    </Window>
  )
}
