import { useState, type SubmitEvent } from 'react'
import { useOutletContext } from 'react-router'
import { useMutation, useQuery } from 'convex/react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import LinkIcon from '@mui/icons-material/Link'
import DeleteIcon from '@mui/icons-material/Delete'
import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'
import { errorMessage } from '../../../lib/errors'
import CopyLinkButton from './CopyLinkButton'

/** Both dashboards provide this via <Outlet context={…} />. */
export type EventTabContext = {
  event: Doc<'events'> & { role: 'creator' | 'manager' }
}

export default function TeamsTab() {
  const { event } = useOutletContext<EventTabContext>()

  const teams = useQuery(api.teams.listForEvent, { eventId: event._id })
  const createTeam = useMutation(api.teams.create)
  const removeTeam = useMutation(api.teams.remove)

  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const canCreate = event.status !== 'ended'

  async function handleCreate(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setCreating(true)
    try {
      await createTeam({ eventId: event._id, name })
      setName('')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  async function copyLink(teamId: string, joinCode: string) {
    await navigator.clipboard.writeText(
      `${window.location.origin}/join/${joinCode}`,
    )
    setCopiedId(teamId)
    setTimeout(() => setCopiedId((current) => (current === teamId ? null : current)), 2000)
  }

  async function handleRemove(teamId: Id<'teams'>, teamName: string) {
    if (
      !window.confirm(
        `Delete team "${teamName}"? Its join link will stop working.`,
      )
    ) {
      return
    }
    setError(null)
    try {
      await removeTeam({ teamId })
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant='h6'>Teams</Typography>

      <Stack component='form' direction='row' spacing={1} onSubmit={handleCreate}>
        <TextField
          label='Team name'
          size='small'
          value={name}
          onChange={(e) => setName(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 40 } }}
          fullWidth
        />
        <Button
          type='submit'
          variant='contained'
          startIcon={
            creating ? <CircularProgress size={18} /> : <GroupAddIcon />
          }
          disabled={!canCreate || creating || name.trim() === ''}
          sx={{ flexShrink: 0 }}
        >
          Create
        </Button>
      </Stack>

      {error !== null && <Alert severity='error'>{error}</Alert>}

      {teams === undefined ? (
        <CircularProgress />
      ) : teams === null ? (
        <Alert severity='warning'>
          You don't have access to this event's teams.
        </Alert>
      ) : teams.length === 0 ? (
        <Typography color='text.secondary'>
          No teams yet. Each team room holds three players, one per role.
        </Typography>
      ) : (
        teams.map((t) => (
          <Card key={t._id} variant='outlined'>
            <CardContent>
              <Stack direction='row' spacing={2} sx={{ alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography>{t.name}</Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontFamily: 'monospace' }}
                  >
                    {t.joinCode}
                  </Typography>
                </Box>
                <Chip
                  label={`${t.memberCount}/${t.capacity}`}
                  size='small'
                  color={t.memberCount >= t.capacity ? 'success' : 'default'}
                />
                <Button
                  size='small'
                  startIcon={<LinkIcon />}
                  onClick={() => void copyLink(t._id, t.joinCode)}
                >
                  {copiedId === t._id ? 'Copied' : 'Copy link'}
                </Button>
                {t.memberCount === 0 && (
                  <IconButton
                    aria-label='delete team'
                    size='small'
                    onClick={() => void handleRemove(t._id, t.name)}
                  >
                    <DeleteIcon fontSize='small' />
                  </IconButton>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))
      )}

      <CopyLinkButton
        path={`/events/${event._id}/teams`}
        label='Copy participant link'
      />
    </Stack>
  )
}
