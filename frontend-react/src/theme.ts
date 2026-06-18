import { createTheme } from '@mui/material/styles'

export const getAppTheme = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      background: {
        default: isDark ? '#0d1117' : '#f5f7fa',
        paper: isDark ? '#161b22' : '#ffffff',
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
        primary: isDark ? '#e6edf3' : '#1f2328',
        secondary: isDark ? '#8b949e' : '#656d76',
      },
      divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      subtitle2: { color: isDark ? '#8b949e' : '#656d76' },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: isDark ? 'rgba(22,27,34,0.9)' : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
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
          root: { borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
          head: { fontWeight: 600, color: isDark ? '#8b949e' : '#656d76', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
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
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            },
            '& .MuiDataGrid-row:hover': {
              background: isDark ? 'rgba(0,230,118,0.04)' : 'rgba(0,230,118,0.08)',
            },
            '& .MuiDataGrid-cell': {
              borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            },
          },
        },
      },
    },
  })
}
