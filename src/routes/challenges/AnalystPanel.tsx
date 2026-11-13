import { Typography } from '@mui/material'
import type { FunctionReturnType } from 'convex/server'
import { api } from '../../../convex/_generated/api'
import Window from '../../components/Window'

type Current = FunctionReturnType<typeof api.challenges.getCurrent>
type ActiveCurrent = Extract<Current, { status: 'active' }>
type AnalystChallenge = Extract<ActiveCurrent['challenge'], { role: 'analyst' }>

export default function AnalystPanel({
  challenge,
}: {
  challenge: AnalystChallenge
}) {
  return (
    <Window
      title={challenge.analyst.title}
      sx={{ minHeight: 0 }}
    >
      <Typography sx={{ whiteSpace: 'pre-wrap' }}>
        {challenge.analyst.body}
      </Typography>
    </Window>
  )
}
