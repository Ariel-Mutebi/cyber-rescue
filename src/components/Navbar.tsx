import { AppBar, Toolbar, Typography, Button, Link } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'

interface NavbarProps {
  isCreator?: boolean
  signOut?: () => void
}

export default function Navbar({ isCreator, signOut }: NavbarProps) {
  return (
    <AppBar position='static' color='transparent' elevation={0}>
      <Toolbar sx={{ gap: 2 }}>
        <Link
          component={RouterLink}
          to='/'
          underline='none'
          color='inherit'
          sx={{
            display: 'flex',
            gap: 1,
            flexGrow: 1,
          }}
        >
          <Logo size='sm' />
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            Cyber Rescue
          </Typography>        
        </Link>
        <ThemeToggle />
        {isCreator && (
          <Button component={RouterLink} to='/creator/events'>
            My events
          </Button>
        )}
        {signOut && (
          <Button
            variant='outlined'
            color='secondary'
            onClick={() => void signOut()}
          >
            Sign out
          </Button>
        )}
      </Toolbar>
    </AppBar>
  )
}
