import { useState, type SubmitEvent } from 'react'
import { useMutation } from 'convex/react'
import { Alert, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { errorMessage } from '../lib/errors'

export default function HandleForm({
  eventId,
  onRegistered,
}: {
  eventId: Id<'events'>
  onRegistered: (token: string) => void
}) {
  const register = useMutation(api.participants.register)
  const [handle, setHandle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { token } = await register({ eventId, handle })
      onRegistered(token)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack component='form' spacing={2} onSubmit={handleSubmit}>
      <Stack spacing={0.5}>
        <Typography variant='h6'>Pick a handle</Typography>
        <Typography color='text.secondary'>
          Anything you like. No real name or email needed. Your teammates will see it.
        </Typography>
      </Stack>

      {error !== null && <Alert severity='error'>{error}</Alert>}

      <TextField
        label='Handle'
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        slotProps={{ htmlInput: { maxLength: 20 } }}
        autoFocus
      />
      <Button
        type='submit'
        variant='contained'
        size='large'
        disabled={submitting || handle.trim().length < 2}
        startIcon={submitting ? <CircularProgress size={18} /> : undefined}
      >
        Continue
      </Button>
    </Stack>
  )
}
