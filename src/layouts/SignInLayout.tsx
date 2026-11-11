import { Box } from '@mui/material'
import { Outlet } from 'react-router'
import Background from '../components/Background'
import Navbar from '../components/Navbar'

export default function SignInLayout() {
  return (
    <Background>
      <Navbar />
      <Box sx={{ display: 'grid', placeItems: 'center', p: 2 }}>
        <Outlet />
      </Box>
    </Background>
  )
}
