import { useEffect, useState } from 'react'
import { useMutation } from 'convex/react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import type { FunctionReturnType } from 'convex/server'
import { api } from '../../../convex/_generated/api'

type TripleLock = Extract<
  FunctionReturnType<typeof api.challenges.getCurrent>,
  { status: 'triple-lock' }
>

export default function TripleLock({
  current,
  token,
}: {
  current: TripleLock
  token: string
}) {
  const press = useMutation(api.locks.press)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const now = useNow(200)

  const { presses, myParticipantId, windowMs } = current
  const myPress = presses.find((p) => p.participantId === myParticipantId)
  const earliest = presses.length > 0 ? Math.min(...presses.map((p) => p.pressedAt)) : null
  const remainingMs =
    earliest !== null ? Math.max(0, earliest + windowMs - now) : null
  const expired = remainingMs === 0 && presses.length < 3

  async function handlePress() {
    setSaving(true)
    setError(null)
    try {
      const result = await press({ token })
      if (result.status === 'out-of-sync') {
        setError('Window expired. Everyone needs to press again.')
      } else if (result.status === 'already-unlocked') {
        // getCurrent will transition; nothing to do
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack spacing={3} sx={{ alignItems: 'center', py: 6, maxWidth: 560, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="overline" color="text.secondary">
          Triple Lock
        </Typography>
        <Typography variant="h4">Synchronize with your team</Typography>
        <Typography color="text.secondary" sx={{ pt: 1 }}>
          All three members must press within {windowMs / 1000} seconds of each
          other. This confirms you're all here and in sync.
        </Typography>
      </Box>

      <Stack spacing={1} sx={{ width: '100%' }}>
        {presses.map((p) => (
          <Card key={p.participantId} variant="outlined">
            <CardContent
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 1.5,
                '&:last-child': { pb: 1.5 },
              }}
            >
              <Typography sx={{ flexGrow: 1 }}>
                {p.handle}
                {p.participantId === myParticipantId && ' (you)'}
              </Typography>
              <Chip label="✓ Ready" color="success" size="small" />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 60, textAlign: 'right' }}
              >
                +{((p.pressedAt - (earliest ?? p.pressedAt)) / 1000).toFixed(1)}s
              </Typography>
            </CardContent>
          </Card>
        ))}
        {Array.from({ length: Math.max(0, 3 - presses.length) }).map((_, i) => (
          <Card key={`empty-${i}`} variant="outlined" sx={{ opacity: 0.6 }}>
            <CardContent
              sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}
            >
              <Typography color="text.secondary">Waiting for a teammate…</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {remainingMs !== null && !expired && (
        <Typography
          variant="h4"
          sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.primary' }}
        >
          {(remainingMs / 1000).toFixed(1)}s
        </Typography>
      )}

      {expired && (
        <Alert severity="warning" sx={{ width: '100%' }}>
          Window expired. Press again to start a new window.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      )}

      {myPress !== undefined && !expired ? (
        <Button size="large" variant="contained" disabled sx={{ minWidth: 280 }}>
          ✓ Ready — waiting for teammates
        </Button>
      ) : (
        <Button
          size="large"
          variant="contained"
          disabled={saving}
          onClick={() => void handlePress()}
          sx={{ minWidth: 280 }}
        >
          {saving ? (
            <CircularProgress size={24} color="inherit" />
          ) : myPress !== undefined ? (
            'Press again'
          ) : (
            "I'm Ready"
          )}
        </Button>
      )}
    </Stack>
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
