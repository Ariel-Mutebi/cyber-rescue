import { useState } from 'react'
import { useMutation } from 'convex/react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { ConvexError } from 'convex/values'
import type { Id } from '../../../convex/_generated/dataModel'
import { api } from '../../../convex/_generated/api'

export default function FlagDialog({
  open,
  onClose,
  token,
  challengeId,
  flagFormat,
}: {
  open: boolean
  onClose: () => void
  token: string
  challengeId: Id<'challenges'>
  flagFormat: string
}) {
  const submit = useMutation(api.challenges.submitFlag)
  const [flag, setFlag] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ points: number; debrief: string } | null>(null)

  function reset() {
    setFlag('')
    setError(null)
    setSuccess(null)
  }

  async function handleSubmit() {
    if (flag.trim() === '') return
    setBusy(true)
    setError(null)
    try {
      const result = await submit({ token, challengeId, flag })
      if (!result.correct) {
        setError('Not the right flag.')
      } else if ('alreadySolved' in result) {
        setSuccess({ points: 0, debrief: '' })
      } else {
        setSuccess({ points: result.points, debrief: result.debrief })
      }
    } catch (e) {
      setError(e instanceof ConvexError ? String(e.data) : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  function handleClose() {
    if (busy) return
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>{success ? 'Solved!' : 'Submit flag'}</DialogTitle>
      <DialogContent>
        {success ? (
          <Stack spacing={2}>
            {success.points > 0 && (
              <Typography variant="h5">+{success.points} points</Typography>
            )}
            {success.debrief && (
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{success.debrief}</Typography>
            )}
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Format: <code>{flagFormat}</code>
            </Typography>
            <TextField
              autoFocus
              fullWidth
              label="Flag"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              disabled={busy}
            />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        {success ? (
          <Button variant="contained" onClick={handleClose}>Close</Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={busy}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={busy || flag.trim() === ''}
            >
              Submit
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
