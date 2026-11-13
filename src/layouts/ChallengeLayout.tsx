import { Outlet } from 'react-router'
import { Box } from '@mui/material'
import Background from '../components/Background'
import Navbar from '../components/Navbar'

export default function ChallengeLayout() {
  return (
    <Background>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        <Navbar />
        <Box sx={{ flex: 1, minHeight: 0, p: { xs: 1.5, md: 2 } }}>
          <Outlet />
        </Box>
      </Box>
    </Background>
  )
}
