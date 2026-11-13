import '@wterm/react/css'
import { useCallback, useRef } from 'react'
import { BashShell } from '@wterm/just-bash'
import { Terminal as WTerm, useTerminal } from '@wterm/react'
import type { ActiveChallenge } from './ActiveChallenge'

interface OperatorProps {
  operator: Extract<ActiveChallenge, { role: 'operator' }>['operator']
}

export default function Terminal({ operator }: OperatorProps) {
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
