import { useColorScheme } from '@mui/material/styles'
import { IconButton } from '@mui/material'
import { LightMode, DarkMode } from '@mui/icons-material'

export default function ThemeToggle() {
  const { mode, systemMode, setMode } = useColorScheme()
  const resolved = mode === 'system' ? systemMode : mode

  return (
    <IconButton
      onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')}
      color="inherit"
    >
      {mode === 'dark' ? <LightMode /> : <DarkMode />}
    </IconButton>
  )
}
