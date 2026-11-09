import { useState, type SubmitEvent } from 'react'
import { useAction, useMutation, useQuery } from 'convex/react'
import { ConvexError } from 'convex/values'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

type Credentials = { username: string; password: string }

function errorMessage(err: unknown) {
  return err instanceof ConvexError ? String(err.data) : 'Something went wrong'
}

export default function ManagerSection({
  eventId,
  canAdd,
}: {
  eventId: Id<'events'>
  canAdd: boolean
}) {
  const managers = useQuery(api.users.listManagers, { eventId })
  const createManager = useAction(api.users.createManager)
  const revokeManager = useMutation(api.users.revokeManager)

  const [username, setUsername] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<Credentials | null>(null)

  async function handleAdd(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setCreating(true)
    try {
      const { username: created, password } = await createManager({ eventId, username })
      setCredentials({ username: created, password })
      setUsername('')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke(managerId: Id<'users'>, managerUsername: string | undefined) {
    if (
      !window.confirm(`Revoke ${managerUsername ?? 'this manager'}? They will be signed out.`)
    ) {
      return
    }
    setError(null)
    try {
      await revokeManager({ managerId })
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant='h6'>Event managers</Typography>

      <Stack component='form' direction='row' spacing={1} onSubmit={handleAdd}>
        <TextField
          label='Manager username'
          size='small'
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          helperText='Letters, numbers, - and _ (3-30 characters)'
          slotProps={{ htmlInput: { maxLength: 30 } }}
          fullWidth
        />
        <Button
          type='submit'
          variant='contained'
          startIcon={creating ? <CircularProgress size={18} /> : <PersonAddIcon />}
          disabled={!canAdd || creating || username.trim().length < 3}
          sx={{ flexShrink: 0 }}
        >
          Add
        </Button>
      </Stack>

      {error !== null && <Alert severity='error'>{error}</Alert>}

      {managers === undefined ? (
        <CircularProgress />
      ) : managers.length === 0 ? (
        <Typography color='text.secondary'>
          No managers yet. Each one gets a temporary account that expires after the event.
        </Typography>
      ) : (
        managers.map((m) => (
          <Card key={m._id} variant='outlined'>
            <CardContent>
              <Stack direction='row' sx={{ alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography sx={{ fontFamily: 'monospace' }}>{m.username}</Typography>
                  {m.expiresAt !== undefined && (
                    <Typography variant='body2' color='text.secondary'>
                      Expires {new Date(m.expiresAt).toLocaleString()}
                    </Typography>
                  )}
                </Box>
                <IconButton
                  aria-label='revoke manager'
                  onClick={() => void handleRevoke(m._id, m.username)}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </CardContent>
          </Card>
        ))
      )}

      <CredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />
    </Stack>
  )
}

function CredentialsDialog({
  credentials,
  onClose,
}: {
  credentials: Credentials | null
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (credentials === null) return
    await navigator.clipboard.writeText(
      `Username: ${credentials.username}\nPassword: ${credentials.password}`,
    )
    setCopied(true)
  }

  function close() {
    setCopied(false)
    onClose()
  }

  return (
    <Dialog
      open={credentials !== null}
      // no backdrop or Esc dismissal: closing is the moment the password is gone
      onClose={(_, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return
        close()
      }}
      maxWidth='xs'
      fullWidth
    >
      <DialogTitle>Account for {credentials?.username}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Alert severity='warning'>
            Copy these now. The password is only shown once and can't be recovered.
          </Alert>
          <Box sx={{ fontFamily: 'monospace' }}>
            <DialogContentText component='div'>Username</DialogContentText>
            <Typography sx={{ fontFamily: 'inherit' }}>{credentials?.username}</Typography>
            <DialogContentText component='div' sx={{ mt: 1 }}>
              Password
            </DialogContentText>
            <Typography sx={{ fontFamily: 'inherit' }}>{credentials?.password}</Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button startIcon={<ContentCopyIcon />} onClick={() => void copy()}>
          {copied ? 'Copied' : 'Copy both'}
        </Button>
        <Button variant='contained' onClick={close}>
          I've saved them
        </Button>
      </DialogActions>
    </Dialog>
  )
}
