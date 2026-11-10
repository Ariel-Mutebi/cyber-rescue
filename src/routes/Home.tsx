import { Link as RouterLink } from 'react-router'
import { useQuery } from 'convex/react'
import {
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Link,
  Stack,
  Typography,
} from '@mui/material'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

type EventSummary = {
  _id: Id<'events'>
  title: string
  description?: string
  scheduledAt: number
  startedAt?: number
}

export default function Home() {
  const events = useQuery(api.events.listPublic)

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant='h5'>Events</Typography>
        <Typography color='text.secondary'>
          Pick an event to choose a team and join in.
        </Typography>
      </Stack>

      {events === undefined ? (
        <CircularProgress />
      ) : events.live.length === 0 && events.upcoming.length === 0 ? (
        <Typography color='text.secondary'>
          No events right now. Check back soon.
        </Typography>
      ) : (
        <>
          {events.live.length > 0 && (
            <Stack spacing={1.5}>
              <Typography variant='overline' color='success.main'>
                Live now
              </Typography>
              {events.live.map((e) => (
                <EventCard key={e._id} event={e} live />
              ))}
            </Stack>
          )}

          {events.upcoming.length > 0 && (
            <Stack spacing={1.5}>
              <Typography variant='overline' color='text.secondary'>
                Upcoming
              </Typography>
              {events.upcoming.map((e) => (
                <EventCard key={e._id} event={e} live={false} />
              ))}
            </Stack>
          )}
        </>
      )}

      <Typography variant='body2' color='text.secondary' sx={{ pt: 2 }}>
        Hosting an event?{' '}
        <Link component={RouterLink} to='/creator/sign-in'>
          Creator sign-in
        </Link>
        {' · '}Event manager?{' '}
        <Link component={RouterLink} to='/manager/sign-in'>
          Manager sign-in
        </Link>
      </Typography>
    </Stack>
  )
}

function EventCard({ event, live }: { event: EventSummary; live: boolean }) {
  const when = new Date(live ? (event.startedAt ?? event.scheduledAt) : event.scheduledAt)

  return (
    <Card
      variant='outlined'
      sx={live ? { borderColor: 'success.main', borderWidth: 2 } : undefined}
    >
      <CardActionArea component={RouterLink} to={`/events/${event._id}/teams`}>
        <CardContent>
          <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant='h6' sx={{ flexGrow: 1 }}>
              {event.title}
            </Typography>
            {live && (
              <Chip
                icon={<FiberManualRecordIcon />}
                label='Live now'
                color='success'
                size='small'
              />
            )}
          </Stack>
          <Typography color='text.secondary'>
            {live ? 'Started' : 'Starts'} {when.toLocaleString()}
          </Typography>
          {event.description !== undefined && (
            <Typography
              sx={{
                pt: 1,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {event.description}
            </Typography>
          )}
          <Typography
            variant='body2'
            color={live ? 'success.main' : 'primary'}
            sx={{ pt: 1, fontWeight: 500 }}
          >
            {live ? 'Join now →' : 'Choose a team →'}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
