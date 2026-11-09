import { useColorScheme } from '@mui/material/styles'

interface LogoProps {
  size?: 'sm' | 'md'
}

export default function Logo({ size = 'sm' }: LogoProps) {
  const { mode } = useColorScheme()

  return (
    <img
      alt='Logo'
      src={`/logo-${mode === 'system' ? 'dark' : mode}-${size}.png`}
    />
  )
}
