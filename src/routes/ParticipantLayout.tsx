import { Outlet } from 'react-router'
import { Box, Container, Paper } from '@mui/material'
import Background from '../components/Background'
import Navbar from '../components/Navbar'

export default function ParticipantLayout() {
  return (
    <Background>
      <Navbar />
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
