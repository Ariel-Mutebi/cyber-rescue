import { useQuery } from 'convex/react'
import { Alert, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import TeamSection from './TeamSection'
import { api } from '../../convex/_generated/api'
import CopyLinkButton from '../components/CopyLinkButton'

export default function ManagerDashboard() {
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
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant='h5'>{event.title}</Typography>
          <Chip label={event.status} size='small' />
        </Stack>
        <Typography color='text.secondary'>
          {new Date(event.scheduledAt).toLocaleString()}
        </Typography>
        {event.description !== undefined && <Typography>{event.description}</Typography>}
      </Stack>

      <TeamSection eventId={event._id} canCreate={event.status !== 'ended'} />
      <CopyLinkButton path={`/events/${event._id}/teams`} label='Copy participant link' />
    </Stack>
  )
}
