import { useState, type SubmitEvent } from 'react'
import { Link as RouterLink, Navigate } from 'react-router'
import { useConvexAuth, useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Logo from '../components/Logo'
import { api } from '../../convex/_generated/api'

export default function ManagerSignIn() {
  const { signIn } = useAuthActions()
  const { isAuthenticated } = useConvexAuth()
  const me = useQuery(api.users.me, isAuthenticated ? {} : 'skip')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // once the session exists and users.me resolves, this fires on its own
  if (me?.accountType === 'manager') {
    return <Navigate to='/manager' replace />
  }

  const canSubmit = username.trim() !== '' && password !== '' && !submitting

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    try {
      await signIn('manager', {
        // the Password provider reads the account id from the 'email' key
        email: username.trim().toLowerCase(),
        password,
        flow: 'signIn',
      })
    } catch {
      // same message for unknown username and wrong password
      setError('Incorrect username or password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card sx={{ width: '100%', maxWidth: 400, bgcolor: 'background.default' }}>
      <CardContent>
        <Stack component='form' spacing={2} onSubmit={handleSubmit} sx={{ py: 2 }}>
          <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
            <Logo />
            <Typography
              variant='h5'
              style={{
                fontWeight: 600,
                fontFamily: 'monospace',
              }}
            >
              Event manager
            </Typography>
            <Typography color='text.secondary' align='center'>
              Sign in with the account your event creator gave you
            </Typography>
          </Stack>

          {error !== null && <Alert severity='error'>{error}</Alert>}

          <TextField
            label='Username'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete='username'
            slotProps={{ htmlInput: { autoCapitalize: 'none', spellCheck: false } }}
            autoFocus
            required
          />
          <TextField
            label='Password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete='current-password'
            required
          />

          <Button
            type='submit'
            variant='contained'
            size='large'
            disabled={!canSubmit}
            startIcon={submitting ? <CircularProgress size={18} /> : undefined}
          >
            Sign in
          </Button>

          <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center' }}>
            Hosting an event?{' '}
            <Link component={RouterLink} to='/creator/sign-in'>
              Creator sign-in
            </Link>
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}
