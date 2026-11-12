import { Link as RouterLink, Outlet, useLocation } from 'react-router'
import { useQuery } from 'convex/react'
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { api } from '../../../convex/_generated/api'

const TABS = [
  { label: 'Teams', segment: 'teams' },
  { label: 'Challenges', segment: 'challenges' },
  { label: 'Details', segment: 'details' },
] as const

export default function ManagerDashboard() {
  const location = useLocation()
  const me = useQuery(api.users.me)
  const eventId = me?.managerOfEventId
  const event = useQuery(
    api.events.get,
    eventId === undefined ? 'skip' : { eventId },
  )

  if (me === undefined || (eventId !== undefined && event === undefined)) {
    return <CircularProgress />
  }

  if (event === null || event === undefined) {
    return (
      <Alert severity='warning'>
        You don't have access to an event. Your account may have expired.
      </Alert>
    )
  }

  const segment = location.pathname.split('/').pop()
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
              to={`/manager/${tab.segment}`}
            />
          ))}
        </Tabs>
      </Box>

      <Outlet context={{ event }} />
    </Stack>
  )
}
