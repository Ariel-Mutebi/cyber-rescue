import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },

  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#846c5b'
        },
        secondary: {
          main: '#f2d398'
        },
        background: {
          default: '#e8ebf7',
          paper: '#f5f2ec'
        }
      }
    },

    dark: {
      palette: {
        primary: {
          main: '#9AA0A8'
        },
        secondary: {
          main: '#a7c4b5'
        },
        background: {
          default: '#151515',
          paper: '#72705b'
        }
      }
    }
  },

  shape: {
    borderRadius: 8
  },

  typography: {
    // inspired by wterm terminal's defaults
    fontFamily: [
      'Menlo',
      'Consolas',
      'DejaVu Sans Mono',
      'Courier New',
      'monospace',
    ].join(', '),
  }
})
