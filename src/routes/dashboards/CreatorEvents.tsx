import { Link as RouterLink } from 'react-router'
import { useQuery } from 'convex/react'
import {
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { api } from '../../../convex/_generated/api'

export default function CreatorEvents() {
  const events = useQuery(api.events.listMine)

  return (
    <Stack spacing={3}>
      <Stack direction='row' sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant='h5'>My events</Typography>
        <Button
          component={RouterLink}
          to='/creator/new-event'
          variant='contained'
          startIcon={<AddIcon />}
        >
          New event
        </Button>
      </Stack>

      {events === undefined ? (
        <CircularProgress />
      ) : events.length === 0 ? (
        <Typography color='text.secondary'>You haven't scheduled an event yet.</Typography>
      ) : (
        events.map((e) => (
          <Card key={e._id} variant='outlined'>
            <Stack direction='row' sx={{ alignItems: 'center' }}>
              <CardActionArea
                component={RouterLink}
                to={`/creator/events/${e._id}`}
                sx={{ flexGrow: 1 }}
              >
                <CardContent>
                  <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography variant='h6'>{e.title}</Typography>
                    <Chip label={e.status} size='small' />
                  </Stack>
                  <Typography color='text.secondary'>
                    {new Date(e.scheduledAt).toLocaleString()}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Stack>
          </Card>
        ))
      )}
    </Stack>
  )
}
