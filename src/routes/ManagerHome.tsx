import { useQuery } from 'convex/react'
import { Alert, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import { api } from '../../convex/_generated/api'

export default function ManagerHome() {
  const me = useQuery(api.users.me)
  const eventId = me?.managerOfEventId
  const event = useQuery(api.events.get, eventId === undefined ? 'skip' : { eventId })

  if (me === undefined || (eventId !== undefined && event === undefined)) {
    return <CircularProgress />
  }

  // events.get returns null for an expired account
  if (event === null || event === undefined) {
    return (
      <Alert severity='warning'>
        You don't have access to an event. Your account may have expired.
      </Alert>
    )
  }

  return (
    <Stack spacing={1}>
      <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
        <Typography variant='h5'>{event.title}</Typography>
        <Chip label={event.status} size='small' />
      </Stack>
      <Typography color='text.secondary'>
        {new Date(event.scheduledAt).toLocaleString()}
      </Typography>
      <Typography sx={{ pt: 2 }}>Dashboard coming soon.</Typography>
    </Stack>
  )
}
