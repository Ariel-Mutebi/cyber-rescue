import { useColorScheme } from '@mui/material/styles'

interface LogoProps {
  size?: 'sm' | 'md'
}

const map = {
  sm: 32,
  md: 64,
}

export default function Logo({ size = 'sm' }: LogoProps) {
  const { mode } = useColorScheme()

  return (
    <img
      alt='Logo'
      src={`/logo-${mode === 'system' ? 'dark' : mode}-${size}.png`}
      style={{
        width: map[size],
        height: map[size],
      }}
    />
  )
}
