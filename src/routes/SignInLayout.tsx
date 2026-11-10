import { AppBar, Box } from '@mui/material'
import { Outlet } from 'react-router'
import Background from '../components/Background'
import ThemeToggle from '../components/ThemeToggle'

export default function SignInLayout() {
  return (
    <Background>
      <AppBar
       position='static'
       color='transparent'
       elevation={0}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-end',
        }}
      >
        <ThemeToggle />
      </AppBar>
      <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', p: 2 }}>
        <Outlet />
      </Box>
    </Background>
  )
}
