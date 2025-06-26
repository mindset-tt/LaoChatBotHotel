import { createTheme, Theme } from '@mui/material/styles';
import { COLORS } from '../constants/colors';

declare module '@mui/material/styles' {
  interface Palette {
    gradient: {
      primary: string;
      secondary: string;
    };
  }

  interface PaletteOptions {
    gradient?: {
      primary: string;
      secondary: string;
    };
  }
}

export const createAppTheme = (mode: 'light' | 'dark' = 'light'): Theme => {
  const isLight = mode === 'light';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: COLORS.PRIMARY[500],
        light: COLORS.PRIMARY[300],
        dark: COLORS.PRIMARY[700],
        contrastText: '#ffffff',
      },
      secondary: {
        main: COLORS.SECONDARY[500],
        light: COLORS.SECONDARY[300],
        dark: COLORS.SECONDARY[700],
        contrastText: '#ffffff',
      },
      success: {
        main: COLORS.SUCCESS[500],
        light: COLORS.SUCCESS[300],
        dark: COLORS.SUCCESS[700],
      },
      warning: {
        main: COLORS.WARNING[500],
        light: COLORS.WARNING[300],
        dark: COLORS.WARNING[700],
      },
      error: {
        main: COLORS.ERROR[500],
        light: COLORS.ERROR[300],
        dark: COLORS.ERROR[700],
      },
      background: {
        default: isLight ? COLORS.BACKGROUND.DEFAULT : COLORS.NEUTRAL[900],
        paper: isLight ? COLORS.BACKGROUND.PAPER : COLORS.NEUTRAL[800],
      },
      text: {
        primary: isLight ? COLORS.TEXT.PRIMARY : COLORS.NEUTRAL[50],
        secondary: isLight ? COLORS.TEXT.SECONDARY : COLORS.NEUTRAL[300],
        disabled: isLight ? COLORS.TEXT.DISABLED : COLORS.NEUTRAL[500],
      },
      divider: isLight ? COLORS.NEUTRAL[200] : COLORS.NEUTRAL[700],
      gradient: {
        primary: `linear-gradient(135deg, ${COLORS.PRIMARY[500]} 0%, ${COLORS.PRIMARY[700]} 100%)`,
        secondary: `linear-gradient(135deg, ${COLORS.SECONDARY[500]} 0%, ${COLORS.SECONDARY[700]} 100%)`,
      },
    },
    typography: {
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
        lineHeight: 1.2,
      },
      h2: {
        fontWeight: 600,
        fontSize: '2rem',
        lineHeight: 1.3,
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.75rem',
        lineHeight: 1.4,
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
        lineHeight: 1.4,
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
        lineHeight: 1.5,
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      subtitle1: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.5,
      },
      subtitle2: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.5,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
      },
      button: {
        fontWeight: 600,
        textTransform: 'none',
        fontSize: '0.875rem',
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.4,
      },
      overline: {
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        lineHeight: 1.4,
      },
    },
    shape: {
      borderRadius: 12,
    },
    spacing: 8,
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '10px 24px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          contained: {
            background: `linear-gradient(135deg, ${COLORS.PRIMARY[500]} 0%, ${COLORS.PRIMARY[600]} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${COLORS.PRIMARY[600]} 0%, ${COLORS.PRIMARY[700]} 100%)`,
            },
          },
          outlined: {
            borderColor: COLORS.NEUTRAL[300],
            '&:hover': {
              borderColor: COLORS.PRIMARY[500],
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: isLight 
              ? '0 4px 12px rgba(0, 0, 0, 0.05)'
              : '0 4px 12px rgba(0, 0, 0, 0.3)',
            border: `1px solid ${isLight ? COLORS.NEUTRAL[200] : COLORS.NEUTRAL[700]}`,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: COLORS.PRIMARY[500],
              },
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: isLight ? COLORS.BACKGROUND.DEFAULT : COLORS.NEUTRAL[900],
            boxShadow: `0 1px 3px rgba(0, 0, 0, ${isLight ? '0.1' : '0.3'})`,
            borderBottom: `1px solid ${isLight ? COLORS.NEUTRAL[200] : COLORS.NEUTRAL[700]}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 20,
          },
        },
      },
    },
  });
};
