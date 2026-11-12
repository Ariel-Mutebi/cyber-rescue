import { useState } from 'react'
import { Alert, Button, Snackbar } from '@mui/material'
import { useMutation } from 'convex/react'
import { ConvexError } from 'convex/values'
import type { Doc } from '../../../../convex/_generated/dataModel'
import { api } from '../../../../convex/_generated/api'

type Props = {
  eventId: Doc<'events'>['_id']
  status: Doc<'events'>['status']
}

export default function StartEventButton({ eventId, status }: Props) {
  const start = useMutation(api.events.start)
  const end = useMutation(api.events.end)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    if (
      status === 'live' &&
      !window.confirm('End the event for every team? This cannot be undone.')
    ) {
      return
    }

    setPending(true)
    setError(null)
    try {
      if (status === 'live') await end({ eventId })
      else await start({ eventId })
    } catch (e) {
      setError(e instanceof ConvexError ? String(e.data) : 'Something went wrong')
    } finally {
      setPending(false)
    }
  }

  if (status === 'ended') {
    return (
      <Button variant="contained" disabled>
        Event ended
      </Button>
    )
  }

  const live = status === 'live'

  return (
    <>
      <Button
        variant="contained"
        color={live ? 'inherit' : 'success'}
        disabled={pending}
        onClick={handleClick}
      >
        {live ? 'Stop event' : 'Start event'}
      </Button>
      <Snackbar
        open={error !== null}
        autoHideDuration={6000}
        onClose={(_, reason) => {
          if (reason !== 'clickaway') setError(null)
        }}
      >
        <Alert severity="error" variant="filled" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </>
  )
}
