import { useState, type SubmitEvent } from 'react'
import { useNavigate, useOutletContext } from 'react-router'
import { useMutation } from 'convex/react'
import { Alert, Button, Snackbar, Stack, TextField } from '@mui/material'
import { api } from '../../../../convex/_generated/api'
import type { EventTabContext } from './TeamsTab'
import DeleteEventButton from './DeleteEventButton'
import { errorMessage } from '../../../lib/errors'

/** `<input type='datetime-local'>` wants 'YYYY-MM-DDTHH:mm' in local time. */
function toLocalInput(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}

export default function DetailsTab() {
  const { event } = useOutletContext<EventTabContext>()
  const navigate = useNavigate()
  const update = useMutation(api.events.update)

  // Only the creator can edit, and only while the event is scheduled.
  const editable = event.role === 'creator' && event.status === 'scheduled'

  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description ?? '')
  const [scheduledAt, setScheduledAt] = useState(
    toLocalInput(event.scheduledAt),
  )
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const canSubmit = editable && title.trim() !== '' && scheduledAt !== '' && !submitting

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    try {
      await update({
        eventId: event._id,
        title,
        description,
        scheduledAt: new Date(scheduledAt).getTime(),
      })
      setSaved(true)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack spacing={4}>
      <Stack component='form' spacing={2} onSubmit={handleSubmit}>
        {event.role === 'manager' && (
          <Alert severity='info'>
            Only the event creator can edit these details.
          </Alert>
        )}
        {event.role === 'creator' && event.status !== 'scheduled' && (
          <Alert severity='info'>
            This event has {event.status}. Details can only be edited while
            it's scheduled.
          </Alert>
        )}
        {error !== null && <Alert severity='error'>{error}</Alert>}

        <TextField
          label='Title'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!editable || submitting}
          slotProps={{ htmlInput: { maxLength: 100 } }}
          required
        />
        <TextField
          label='Description'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!editable || submitting}
          slotProps={{ htmlInput: { maxLength: 1000 } }}
          multiline
          minRows={3}
        />
        <TextField
          label='Scheduled at'
          type='datetime-local'
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          disabled={!editable || submitting}
          slotProps={{ inputLabel: { shrink: true } }}
          required
        />

        {editable && (
          <Button
            type='submit'
            variant='contained'
            disabled={!canSubmit}
          >
            {submitting ? 'Saving…' : 'Save changes'}
          </Button>
        )}
      </Stack>

      {event.role === 'creator' && (
        <DeleteEventButton
          eventId={event._id}
          title={event.title}
          disabled={event.status === 'live'}
          onDeleted={() => navigate('/creator/events')}
        />
      )}

      <Snackbar
        open={saved}
        autoHideDuration={3000}
        onClose={() => setSaved(false)}
        message='Event updated'
      />
    </Stack>
  )
}
