import { Outlet } from 'react-router'
import { AppBar, Container, Toolbar, Typography } from '@mui/material'
import Logo from '../components/Logo'

export default function ParticipantLayout() {
  return (
    <>
      <AppBar position='static' color='transparent' elevation={0}>
        <Toolbar>
          <Logo />
          <Typography variant='h6' sx={{ ml: 1 }}>Cyber Rescue</Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth='sm' sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </>
  )
}
