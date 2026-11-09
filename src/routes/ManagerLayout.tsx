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
import SecurityIcon from '@mui/icons-material/Security'
import { api } from '../../convex/_generated/api'

export default function ManagerLayout() {
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

  // signed out, or signed in as a creator
  if (!isAuthenticated || me?.accountType !== 'manager') {
    return <Navigate to='/manager/sign-in' replace />
  }

  return (
    <>
      <AppBar position='static' color='transparent' elevation={0}>
        <Toolbar>
          <SecurityIcon color='primary' sx={{ mr: 1 }} />
          <Typography variant='h6' sx={{ flexGrow: 1 }}>
            Cyber Rescue
          </Typography>
          <Typography color='text.secondary' sx={{ mr: 2, fontFamily: 'monospace' }}>
            {me.name}
          </Typography>
          <Button onClick={() => void signOut()}>Sign out</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth='md' sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </>
  )
}
