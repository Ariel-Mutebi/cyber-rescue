import { MuiMarkdown } from 'mui-markdown'
import Window from '../../components/Window'
import type { ActiveChallenge } from './ActiveChallenge'

interface AnalystProps {
  challenge: Extract<ActiveChallenge, { role: 'analyst' }>
}

export default function AnalystPanel({ challenge }: AnalystProps) {
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
