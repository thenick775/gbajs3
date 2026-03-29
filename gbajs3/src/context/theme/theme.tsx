import type { ThemeOptions } from '@mui/material/styles';

export const GbaDarkTheme: ThemeOptions = {
  // media queries
  isLargerThanPhone: 'only screen and (min-width: 600px)',
  isMobileLandscape:
    'only screen and (max-height: 450px) and (max-width: 1000px) and (orientation: landscape)',
  isMobileWithUrlBar:
    'only screen and (max-height: 700px) and (orientation: portrait)',

  // css colors
  aliceBlue1: '#f8f9fa',
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
  panelControlGray: '#2a3442',
  panelBlueGray: '#1a2230',
  panelControlText: '#c7d1dc',
  panelSliderAccent: 'rgba(24, 84, 176, 1)',

  // new canonical css colors
  modalSurface: '#0a0d12',
  modalSurfaceElevated: '#0c1017',
  modalBorder: '#1b2330',
  modalBorderStrong: '#6f7480',
  modalTextPrimary: '#f1f3f6',
  modalTextSecondary: '#a7adb8',
  surfaceTextPrimary: '#e6edf3',
  modalIconMuted: '#a9b4c2',
  modalHoverSurface: '#111722',
  modalDropzoneSurface: '#090d14',
  modalSectionSurface: '#161e2a',
  modalSectionBorder: '#1f2a3a',
  modalListBorder: '#283243',
  modalListItemHoverSurface: '#141b27',
  modalCloseButtonHoverSurface: '#1a2230',
  modalCloseButtonHoverBorder: '#2a3a52',
  modalContainerSurface: '#121821',
  focusRingPrimary: 'rgba(47, 111, 235, 0.25)',
  focusRingPrimarySoft: 'rgba(53, 111, 202, 0.2)',
  menuBackdrop: 'rgba(0, 0, 0, 0.6)',
  menuToggleFocusRing: 'rgba(13, 110, 253, 0.25)',
  modalTabBorder: 'rgba(0, 0, 0, 0.12)',
  errorOverlay: 'rgba(0, 0, 0, 0.5)',
  listItemBorderSubtle: 'rgba(0, 0, 0, 0.125)',
  virtualControlSurface: 'rgba(8, 12, 18, 0.86)',
  virtualControlSurfaceStrong: 'rgba(15, 20, 30, 0.94)',
  virtualControlBorderSubtle: 'rgba(255, 255, 255, 0.14)',
  virtualControlInnerBorder: 'rgba(255, 255, 255, 0.04)',
  virtualControlShadow:
    '0 10px 28px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
  virtualControlPressedShadow: '0 8px 18px rgba(0, 0, 0, 0.18)',
  virtualControlAccentBorder: 'rgba(28, 118, 253, 0.5)',
  virtualControlAccentBorderStrong: 'rgba(28, 118, 253, 0.55)',
  virtualControlAccentHalo: 'rgba(28, 118, 253, 0.12)',
  virtualControlArrow: 'rgba(255, 255, 255, 0.78)',

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
