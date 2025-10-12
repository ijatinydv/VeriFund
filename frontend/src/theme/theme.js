import { createTheme } from '@mui/material/styles';

/**
 * VeriFund Custom Dark Theme
 * A professional, trustworthy design system for fintech applications
 */
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0D47A1', // Deep trustworthy blue
      light: '#5472D3',
      dark: '#002171',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00BFA5', // Vibrant teal for accents
      light: '#5DF2D6',
      dark: '#008E76',
      contrastText: '#000000',
    },
    background: {
      default: '#0A0E27', // Deep navy background
      paper: '#121635', // Slightly lighter for cards
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    success: {
      main: '#00C853',
    },
    error: {
      main: '#FF1744',
    },
    warning: {
      main: '#FFD600',
    },
    info: {
      main: '#00B8D4',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '3.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2.75rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '1rem',
        },
        contained: {
          boxShadow: '0 4px 14px 0 rgba(0, 191, 165, 0.39)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(0, 191, 165, 0.5)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        },
      },
    },
  },
});

export default theme;
