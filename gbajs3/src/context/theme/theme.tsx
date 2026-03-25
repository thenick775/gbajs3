import type { ThemeOptions } from '@mui/material/styles';

export const GbaDarkTheme: ThemeOptions = {
  // media queries
  isLargerThanPhone: 'only screen and (min-width: 600px)',
  isMobileLandscape:
    'only screen and (max-height: 450px) and (max-width: 1000px) and (orientation: landscape)',
  isMobilePortrait:
    'only screen and (max-width: 1000px) and (orientation: portrait)',
  isMobileWithUrlBar:
    'only screen and (max-height: 700px) and (orientation: portrait)',

  // css colors
  aliceBlue1: '#f8f9fa',
  aliceBlue2: '#edf2f7',
  arcticAirBlue: '#cad8e5',
  blackRussian: '#1a202c',
  blueCharcoal: '#212529',
  checkMarkGreen: '#7ac142',
  darkCharcoal: '#333',
  darkGrayBlue: '#495057',
  disabledGray: '#6c757d',
  errorRed: '#d32f2f',
  gbaThemeBlue: '#1c76fd',
  mediumBlack: '#100901',
  menuHighlight: '#ffffff26',
  menuHover: '#356fca',
  pattensBlue: '#dee2e6',
  pureBlack: '#000',
  pureWhite: '#fff',
  darkGray: '#111',
  panelControlGray: '#a9a9a9',
  panelBlueGray: '#4f555a',

  // darker modal tokens, closer to the approved mock
  modalBackdrop: 'rgba(0, 0, 0, 0.80)',
  modalSurface: '#0a0d12',
  modalSurfaceElevated: '#0c1017',
  modalBorder: '#1b2330',
  modalBorderStrong: '#6f7480',
  modalTextPrimary: '#f1f3f6',
  modalTextSecondary: '#a7adb8',
  modalTextMuted: '#7d8591',
  modalHoverSurface: '#111722',
  modalDropzoneSurface: '#090d14',

  palette: {
    mode: 'dark',
    primary: {
      main: '#356fca',
      light: '#447cda',
      dark: '#2d61b4',
      contrastText: '#ffffff'
    },
    background: {
      default: '#05080d',
      paper: '#0a0d12'
    },
    text: {
      primary: '#f1f3f6',
      secondary: '#a7adb8'
    },
    error: {
      main: '#d32f2f'
    }
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          fontWeight: 500,
          boxShadow: 'none'
        },
        contained: {
          backgroundColor: '#356fca',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#447cda',
            boxShadow: 'none'
          },
          '&:active': {
            backgroundColor: '#2d61b4'
          },
          '&.Mui-disabled': {
            backgroundColor: '#151b26',
            color: '#697381'
          }
        },
        outlined: {
          border: '1px solid #2e3642',
          color: '#f1f3f6',
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: '#111722',
            borderColor: '#3e4653'
          },
          '&.Mui-disabled': {
            borderColor: '#1b2330',
            color: '#697381'
          }
        },
        text: {
          color: '#a7adb8',
          '&:hover': {
            backgroundColor: '#111722'
          }
        }
      }
    },

    MuiTab: {
      styleOverrides: {
        root: {
          color: '#8f97a3',
          textTransform: 'none',
          '&.Mui-selected': {
            color: '#f1f3f6'
          }
        }
      }
    },

    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#356fca',
          height: '2px'
        }
      }
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#a7adb8',
          '&:hover': {
            backgroundColor: '#111722'
          }
        }
      }
    }
  }
};
