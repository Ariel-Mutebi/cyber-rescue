import { Navigate, Outlet } from 'react-router'
import { useConvexAuth, useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  Toolbar,
  Typography,
} from '@mui/material'
import Logo from '../components/Logo'
import { api } from '../../convex/_generated/api'
import ThemeToggle from '../components/ThemeToggle'
import Background from '../components/Background'

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
      <AppBar position='static' color='transparent' elevation={0}>
        <Toolbar>
          <Logo />
          <Typography variant='h6' sx={{ flexGrow: 1, ml: 1 }}>
            Cyber Rescue
          </Typography>
          <ThemeToggle />
          <Button onClick={() => void signOut()}>Sign out</Button>
        </Toolbar>
      </AppBar>
      <Container
        maxWidth='sm'
        sx={{ py: 4 }}
      >
        <Outlet />
      </Container>
    </Background>
  )
}
