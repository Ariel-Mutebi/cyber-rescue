import { useCallback, useRef } from 'react'
import { BashShell } from '@wterm/just-bash'
import { Terminal as WTerm, useTerminal } from '@wterm/react'
import '@wterm/react/css'

export default function Terminal() {
  const { ref, write } = useTerminal()
  const shellRef = useRef<BashShell | null>(null)

  const handleReady = useCallback(() => {
    // React Strict Mode mounts twice in dev; guard prevents duplicate shells.
    if (shellRef.current) return

    const shell = new BashShell({
      files: {
        '/home/user/hello.txt': 'Hello from the operator terminal!\n',
        '/home/user/notes/todo.md': '- find the flag\n- decode the message\n',
      },
      cwd: '/home/user',
      greeting: [
        'Operator terminal ready.',
        'Try: ls, cat hello.txt, cd notes, tab-completion, up-arrow history.',
      ],
    })

    shellRef.current = shell
    shell.attach(write)
  }, [write])

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
