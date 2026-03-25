import '@mui/material/styles';

declare module '@mui/material/styles' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- extending type
  interface Theme {
    isLargerThanPhone: string;
    isMobileLandscape: string;
    isMobilePortrait: string;
    isMobileWithUrlBar: string;
    aliceBlue1: string;
    aliceBlue2: string;
    arcticAirBlue: string;
    blackRussian: string;
    blueCharcoal: string;
    checkMarkGreen: string;
    darkCharcoal: string;
    darkGrayBlue: string;
    disabledGray: string;
    errorRed: string;
    gbaThemeBlue: string;
    mediumBlack: string;
    menuHighlight: string;
    menuHover: string;
    pattensBlue: string;
    pureBlack: string;
    pureWhite: string;
    darkGray: string;
    panelControlGray: string;
    panelBlueGray: string;
    // new canonical theme values
    modalBackdrop: string;
    modalSurface: string;
    modalSurfaceElevated: string;
    modalBorder: string;
    modalBorderStrong: string;
    modalTextPrimary: string;
    modalTextSecondary: string;
    modalTextMuted: string;
    modalHoverSurface: string;
    modalDropzoneSurface: string;
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- extending type
  interface ThemeOptions {
    isLargerThanPhone: string;
    isMobileLandscape: string;
    isMobilePortrait: string;
    isMobileWithUrlBar: string;
    aliceBlue1: string;
    aliceBlue2: string;
    arcticAirBlue: string;
    blackRussian: string;
    blueCharcoal: string;
    checkMarkGreen: string;
    darkCharcoal: string;
    darkGrayBlue: string;
    disabledGray: string;
    errorRed: string;
    gbaThemeBlue: string;
    mediumBlack: string;
    menuHighlight: string;
    menuHover: string;
    pattensBlue: string;
    pureBlack: string;
    pureWhite: string;
    darkGray: string;
    panelControlGray: string;
    panelBlueGray: string;
    // new canonical theme values
    modalBackdrop: string;
    modalSurface: string;
    modalSurfaceElevated: string;
    modalBorder: string;
    modalBorderStrong: string;
    modalTextPrimary: string;
    modalTextSecondary: string;
    modalTextMuted: string;
    modalHoverSurface: string;
    modalDropzoneSurface: string;
  }
}
