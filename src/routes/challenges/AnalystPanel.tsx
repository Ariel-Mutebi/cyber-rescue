import { MuiMarkdown } from 'mui-markdown'
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
      <MuiMarkdown>
        {challenge.analyst.body}
      </MuiMarkdown>
    </Window>
  )
}
