import { useCallback, useRef } from 'react'
import { BashShell } from '@wterm/just-bash'
import { Terminal as WTerm, useTerminal } from '@wterm/react'
import '@wterm/react/css'
import type { FunctionReturnType } from 'convex/server'
import { api } from '../../convex/_generated/api'

type Current = FunctionReturnType<typeof api.challenges.getCurrent>
type ActiveCurrent = Extract<Current, { status: 'active' }>
type Operator = Extract<ActiveCurrent['challenge'], { role: 'operator' }>['operator']

export default function Terminal({ operator }: { operator: Operator }) {
  const { ref, write } = useTerminal()
  const shellRef = useRef<BashShell | null>(null)

  const handleReady = useCallback(() => {
    // The parent must remount this component (key={challenge._id}) when the
    // active challenge changes. Guard against React Strict Mode's double-mount.
    if (shellRef.current) return

    const shell = new BashShell({
      files: Object.fromEntries(
        operator.files.map((f) => [f.path, f.content]),
      ),
      cwd: operator.startDir,
      greeting: [
        `${operator.title} — terminal ready.`,
        `Starting directory: ${operator.startDir}`,
      ],
    })

    shellRef.current = shell
    shell.attach(write)
  }, [operator, write])

  const handleData = useCallback((data: string) => {
    shellRef.current?.handleInput(data)
  }, [])

  return (
    <WTerm
      ref={ref}
      onReady={handleReady}
      onData={handleData}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
