import { Box } from '@mui/material'
import type { PropsWithChildren } from 'react'
import { useColorScheme } from '@mui/material/styles'
import { StaticMeshGradient } from '@paper-design/shaders-react'

export default function Background({ children }: PropsWithChildren) {
  const { mode, systemMode } = useColorScheme()
  const resolved = mode === 'system' ? systemMode : mode

  const colors =
    resolved === 'dark'
      ? [
        '#151515',
        '#282D1F',
        '#9AA0A8',
        '#bdffc6',
      ]
      : [
        '#474248',
        '#acbed8',
        '#e8ebf7',
        '#f2d398',
      ]

  return (
    <Box sx={{ position: 'relative', minHeight: '100dvh' }}>
      <StaticMeshGradient
        colors={colors}
        positions={42}
        waveX={0.4}
        waveXShift={0}
        waveY={1}
        waveYShift={0}
        mixing={0.2}
        grainMixer={0.3}
        grainOverlay={0.8}
        style={{ position: 'absolute', inset: 0 }}
      />
      <Box sx={{ isolation: 'isolate' }}>{children}</Box>
    </Box>
  )
}
