import { useColorScheme } from '@mui/material/styles'
import { IconButton } from '@mui/material'
import { LightMode, DarkMode } from '@mui/icons-material'

export default function ThemeToggle() {
  const { mode, setMode } = useColorScheme()

  if (!mode) return null

  return (
    <IconButton
      onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
      color="inherit"
    >
      {mode === 'dark' ? <LightMode /> : <DarkMode />}
    </IconButton>
  )
}
