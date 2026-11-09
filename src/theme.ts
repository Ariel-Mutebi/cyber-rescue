import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },

  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#1E536E'
        },
        secondary: {
          main: '#6F71A1'
        },
        background: {
          default: '#E5EFFF',
          paper: '#FFFFFF'
        }
      }
    },

    dark: {
      palette: {
        primary: {
          main: '#5AA5CD'
        },
        secondary: {
          main: '#9294BB'
        },
        background: {
          default: '#101D29',
          paper: '#192D3C'
        }
      }
    }
  },

  shape: {
    borderRadius: 8
  },

  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif'
  }
})
