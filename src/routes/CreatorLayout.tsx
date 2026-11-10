import { Navigate, Outlet } from 'react-router'
import { useConvexAuth, useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import {
  Box,
  CircularProgress,
  Container,
  Paper,
} from '@mui/material'
import { api } from '../../convex/_generated/api'
import Background from '../components/Background'
import Navbar from '../components/Navbar'

export default function CreatorLayout() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const { signOut } = useAuthActions()
  const me = useQuery(api.users.me, isAuthenticated ? {} : 'skip')

  if (isLoading || (isAuthenticated && me === undefined)) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  // signed out, or signed in as a manager
  if (!isAuthenticated || me?.accountType !== 'creator') {
    return <Navigate to='/creator/sign-in' replace />
  }

  return (
    <Background>
      <Navbar signOut={() => signOut()} />
      <Box sx={{ pb: 4 }}>
        <Container
          component={Paper}
          elevation={10}
          maxWidth='sm'
          sx={{
            py: 4,
            bgcolor: 'background.default',
          }}
        >
          <Outlet />
        </Container>
      </Box>
    </Background>
  )
}
