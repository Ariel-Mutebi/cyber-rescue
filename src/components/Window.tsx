import type { ReactNode } from 'react'
import { Box, Paper, Typography } from '@mui/material'

export default function Window({
  title,
  actions,
  children,
  scroll = true,
  sx,
  contentSx,
}: {
  title: ReactNode
  actions?: ReactNode
  children: ReactNode
  scroll?: boolean
  sx?: object
  contentSx?: object
}) {
  return (
    <Paper
      elevation={6}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        borderRadius: 2,
        ...sx,
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexShrink: 0,
        }}
      >
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          {title}
        </Typography>
        {actions}
      </Box>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          ...(scroll ? { overflow: 'auto', p: 2 } : { overflow: 'hidden' }),
          ...contentSx,
        }}
      >
        {children}
      </Box>
    </Paper>
  )
}
