import { Link as RouterLink, useParams, useNavigate } from 'react-router'
import { useQuery } from 'convex/react'
import { Alert, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import ManagerSection from './ManagerSection'
import TeamSection from './TeamSection'
import CopyLinkButton from '../components/CopyLinkButton'
import DeleteEventButton from '../components/DeleteEventButton'

export default function EventDashboard() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const event = useQuery(api.events.get, { eventId: eventId as Id<'events'> })

  if (event === undefined) {
    return <CircularProgress />
  }

  if (event === null) {
    return (
      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Alert severity='warning'>Event not found</Alert>
        <Button component={RouterLink} to='/creator/events'>
          Back to my events
        </Button>
      </Stack>
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
      <ManagerSection eventId={event._id} canAdd={event.status !== 'ended'} />

      <DeleteEventButton
        eventId={event._id}
        title={event.title}
        disabled={event.status === 'live'}
        onDeleted={() => navigate('/creator/events')}
      />
    </Stack>
  )
}
