import {
  Link as RouterLink,
  Outlet,
  useLocation,
  useParams,
} from 'react-router'
import { useQuery } from 'convex/react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

const TABS = [
  { label: 'Teams', segment: 'teams' },
  { label: 'Challenges', segment: 'challenges' },
  { label: 'Details', segment: 'details' },
  { label: 'Managers', segment: 'managers' },
] as const

export default function EventDashboard() {
  const { eventId } = useParams()
  const location = useLocation()

  const event = useQuery(api.events.get, {
    eventId: eventId as Id<'events'>,
  })

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

  const base = `/creator/events/${event._id}`
  const segment = location.pathname.split('/').pop()

  // Math.max keeps the tabs valid during the index -> /teams redirect
  const tabValue = Math.max(0, TABS.findIndex((t) => t.segment === segment))

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
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue}>
          {TABS.map((tab) => (
            <Tab
              key={tab.segment}
              label={tab.label}
              component={RouterLink}
              to={`${base}/${tab.segment}`}
            />
          ))}
        </Tabs>
      </Box>

      <Outlet context={{ event }} />
    </Stack>
  )
}
