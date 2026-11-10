import { Navigate, Outlet } from 'react-router'
import { useConvexAuth, useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
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
        <Toolbar sx={{ gap: 1 }}>
          <Logo size='sm' />
          <Typography
            variant='h6'
            sx={{
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 600,
            }}
          >
            Cyber Rescue
          </Typography>
          <ThemeToggle />
          <Button
            variant='outlined'
            color='secondary'
            onClick={() => void signOut()}
          >
            Sign out
          </Button>
        </Toolbar>
      </AppBar>
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
