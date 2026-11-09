import { Navigate } from 'react-router'
import { useConvexAuth, useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import Logo from '../components/Logo.tsx'
import { api } from '../../convex/_generated/api'

export default function CreatorSignIn() {
  const { signIn } = useAuthActions()
  const { isLoading, isAuthenticated } = useConvexAuth()
  const me = useQuery(api.users.me, isAuthenticated ? {} : 'skip')

  // already signed in as a creator: skip this page
  if (me?.accountType === 'creator') {
    return <Navigate to='/creator/new-event' replace />
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent>
          <Stack spacing={3} sx={{ alignItems: 'center', py: 2 }}>
            <Logo size='md' />
            <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
              <Typography variant='h5'>Operation: Cyber Rescue</Typography>
              <Typography color='text.secondary'>Sign in to host an event</Typography>
            </Stack>
            <Button
              variant='contained'
              size='large'
              fullWidth
              startIcon={<GoogleIcon />}
              disabled={isLoading}
              onClick={() => void signIn('google', { redirectTo: '/creator/new-event' })}
            >
              Continue with Google
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
