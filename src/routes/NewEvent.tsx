import { useState, type SubmitEvent } from 'react'
import { useNavigate } from 'react-router'
import { useMutation } from 'convex/react'
import { ConvexError } from 'convex/values'
import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import { api } from '../../convex/_generated/api'

export default function NewEvent() {
  const createEvent = useMutation(api.events.create)
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledAt, setScheduledAt] = useState('') // 'YYYY-MM-DDTHH:mm', local time
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = title.trim() !== '' && scheduledAt !== '' && !submitting

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    try {
      const eventId = await createEvent({
        title,
        description: description.trim() === '' ? undefined : description,
        scheduledAt: new Date(scheduledAt).getTime(),
      })
      navigate(`/creator/events/${eventId}`)
    } catch (err) {
      // our backend throws ConvexError, so the message survives in production
      setError(err instanceof ConvexError ? String(err.data) : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack component='form' spacing={2} onSubmit={handleSubmit}>
      <Typography variant='h5'>Schedule an event</Typography>

      {error !== null && <Alert severity='error'>{error}</Alert>}

      <TextField
        label='Title'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        slotProps={{ htmlInput: { maxLength: 100 } }}
        required
      />
      <TextField
        label='Description'
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        slotProps={{ htmlInput: { maxLength: 1000 } }}
        multiline
        minRows={3}
      />
      <TextField
        label='Start time'
        type='datetime-local'
        value={scheduledAt}
        onChange={(e) => setScheduledAt(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        required
      />

      <Button type='submit' variant='contained' size='large' disabled={!canSubmit}>
        Create event
      </Button>
    </Stack>
  )
}
