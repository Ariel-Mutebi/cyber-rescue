import { useState, useEffect } from 'react'
import { useMutation } from 'convex/react'
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import { ConvexError } from 'convex/values'
import type { FunctionReturnType } from 'convex/server'
import { api } from '../../../convex/_generated/api'

type Current = Extract<
  FunctionReturnType<typeof api.challenges.getCurrent>,
  { status: 'active' }
>

export default function HintsDialog({
  open,
  onClose,
  token,
  current,
}: {
  open: boolean
  onClose: () => void
  token: string
  current: Current
}) {
  const useHint = useMutation(api.challenges.useHint)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const now = useNow(500)

  const { challenge, hintsUsed, startedAt } = current

  async function unlock() {
    setBusy(true)
    setError(null)
    try {
      await useHint({ token })
    } catch (e) {
      setError(e instanceof ConvexError ? String(e.data) : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Hints</DialogTitle>
      <DialogContent>
        {challenge.hints.length === 0 ? (
          <Typography color="text.secondary">No hints for this challenge.</Typography>
        ) : (
          <Stack spacing={2}>
            {challenge.hints.map((hint, i) => {
              const unlocked = i < hintsUsed
              const isNext = i === hintsUsed
              const availableAt = startedAt + hint.afterSeconds * 1000
              const countdown = Math.max(0, availableAt - now)
              const timeReady = countdown === 0

              return (
                <Stack
                  key={i}
                  spacing={1}
                  sx={{
                    p: 1.5,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    opacity: unlocked || isNext ? 1 : 0.6,
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ flex: 1 }}>
                      Hint {i + 1}
                    </Typography>
                    <Chip size="small" label={`−${hint.penalty} pts`} />
                  </Stack>

                  {unlocked ? (
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>{hint.text}</Typography>
                  ) : isNext ? (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        {timeReady
                          ? 'Available now.'
                          : `Unlocks in ${Math.ceil(countdown / 1000)}s.`}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        disabled={!timeReady || busy}
                        onClick={unlock}
                        sx={{ alignSelf: 'flex-start' }}
                      >
                        Unlock (-{hint.penalty} pts)
                      </Button>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Unlocks after Hint {i}
                    </Typography>
                  )}
                </Stack>
              )
            })}
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
