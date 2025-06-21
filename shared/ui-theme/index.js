// shared/ui-theme/index.js
import React, { useMemo } from 'react'; // React import
import PropTypes from 'prop-types';
import { CssBaseline } from '@mui/material';
import { ThemeProvider as MUIThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';

import { lightPalette, darkPalette } from './palette'; // Import your palettes
import typography from './typography';
// import componentsOverride from './componentOverrides'; // To be created later
import shadows, { customShadows } from './shadows'; // Correctly import from local shadows.js

StaGreenThemeProvider.propTypes = {
  children: PropTypes.node,
  mode: PropTypes.oneOf(['light', 'dark']), // Allow selecting mode
};

export default function StaGreenThemeProvider({ children, mode = 'light' }) { // Default to light
  const currentPalette = mode === 'dark' ? darkPalette : lightPalette;

  const themeOptions = useMemo(
    () => ({
      palette: currentPalette,
      shape: { borderRadius: 8 }, // Standard border radius
      typography,
      shadows: shadows, // Use the imported shadows
      customShadows: customShadows, // Use the imported customShadows
    }),
    [currentPalette] // Dependency array ensures theme recalculates if palette changes
  );

  const theme = createTheme(themeOptions);
  // theme.components = componentsOverride(theme); // Uncomment when componentOverrides.js is created

  return (
    <StyledEngineProvider injectFirst>
      <MUIThemeProvider theme={theme}>
        <CssBaseline /> {/* Enables new font, background color, etc. */}
        {children}
      </MUIThemeProvider>
    </StyledEngineProvider>
  );
}
