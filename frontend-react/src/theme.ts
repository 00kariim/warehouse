import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0d1117',
      paper: '#161b22',
    },
    primary: {
      main: '#00e676',
      light: '#33eb91',
      dark: '#00b248',
      contrastText: '#000',
    },
    secondary: {
      main: '#58a6ff',
    },
    error: { main: '#ef5350' },
    warning: { main: '#ffa726' },
    success: { main: '#00e676' },
    text: {
      primary: '#e6edf3',
      secondary: '#8b949e',
    },
    divider: 'rgba(255,255,255,0.08)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle2: { color: '#8b949e' },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(22,27,34,0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.07)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
        containedPrimary: { color: '#000' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: 'rgba(255,255,255,0.06)' },
        head: { fontWeight: 600, color: '#8b949e', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          '& .MuiDataGrid-columnHeaders': {
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          },
          '& .MuiDataGrid-row:hover': {
            background: 'rgba(0,230,118,0.04)',
          },
          '& .MuiDataGrid-cell': {
            borderColor: 'rgba(255,255,255,0.04)',
          },
        },
      },
    },
  },
})
