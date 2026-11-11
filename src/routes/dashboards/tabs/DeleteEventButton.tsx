import { useState } from 'react'
import { useMutation } from 'convex/react'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { errorMessage } from '../../../lib/errors'

export default function DeleteEventButton({
  eventId,
  title,
  disabled = false,
  onDeleted,
}: {
  eventId: Id<'events'>
  title: string
  disabled?: boolean
  onDeleted?: () => void
}) {
  const removeEvent = useMutation(api.events.remove)
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function close() {
    if (deleting) return
    setOpen(false)
    setError(null)
  }

  async function handleDelete() {
    setError(null)
    setDeleting(true)
    try {
      await removeEvent({ eventId })
      setOpen(false)
      onDeleted?.()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Button
        color='error'
        variant='outlined'
        disabled={disabled}
        endIcon={<DeleteIcon />}
        onClick={() => setOpen(true)}
      >
        Delete Event
      </Button>

      <Dialog open={open} onClose={close} maxWidth='xs' fullWidth>
        <DialogTitle>Delete this event?</DialogTitle>
        <DialogContent>
          {error !== null && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <DialogContentText>
            "{title}" will be deleted along with its teams, players, challenges and manager
            accounts. This can't be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color='error'
            variant='contained'
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={18} /> : undefined}
            onClick={() => void handleDelete()}
          >
            Delete event
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
