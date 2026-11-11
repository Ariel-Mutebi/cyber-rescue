import { Navigate } from 'react-router'
import { useConvexAuth, useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { Button, Card, CardContent, Stack, Typography } from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import Logo from '../components/Logo'
import { api } from '../../convex/_generated/api'

export default function CreatorSignIn() {
  const { signIn } = useAuthActions()
  const { isLoading, isAuthenticated } = useConvexAuth()
  const me = useQuery(api.users.me, isAuthenticated ? {} : 'skip')

  // already signed in as a creator: skip this page
  if (me?.accountType === 'creator') {
    return <Navigate to='/creator/' replace />
  }

  return (
    <Card sx={{ width: '100%', maxWidth: 400, bgcolor: 'background.default' }}>
      <CardContent>
        <Stack spacing={3} sx={{ alignItems: 'center', py: 2 }}>
          <Logo size='md' />
          <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
            <Typography
              variant='h5'
              style={{
                fontWeight: 600,
                fontFamily: 'monospace',
              }}
            >
              Cyber Rescue
            </Typography>
            <Typography color='text.secondary'>Sign in to host an event</Typography>
          </Stack>
          <Button
            variant='contained'
            size='large'
            fullWidth
            startIcon={<GoogleIcon />}
            disabled={isLoading}
            onClick={() => void signIn('google', { redirectTo: '/creator/events' })}
          >
            Continue with Google
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
