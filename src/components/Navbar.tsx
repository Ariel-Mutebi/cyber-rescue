import { AppBar, Toolbar, Typography, Button } from "@mui/material"
import Logo from "./Logo"
import ThemeToggle from "./ThemeToggle"

interface NavbarProps {
  signOut?: () => void
}

export default function Navbar({ signOut }: NavbarProps) {
  return (
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
