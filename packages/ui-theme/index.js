// packages/ui-theme/index.js
import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider as MUIThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';

import basePalette from './palette'; // The new simplerPalette
import typography from './typography';
import shape from './shape';
import { createShadow, createCustomShadow } from './shadows'; // Import shadow creation functions
// import componentsOverride from './componentOverrides'; // To be added later

// Helper function to add alpha to hex colors (if not already in palette.js or a util file)
function alpha(color, opacity) {
  if (!color || !color.startsWith('#') || (color.length !== 7 && color.length !== 9)) { // Support #RRGGBB and #RRGGBBAA
    // console.warn(`Invalid color format for alpha function: ${color}`);
    return color;
  }
  // If color already has alpha, strip it for calculation unless we want to blend
  const colorWithoutAlpha = color.length === 9 ? color.substring(0, 7) : color;

  const _opacity = Math.round(Math.min(Math.max(opacity || 1, 0), 1) * 255);
  return colorWithoutAlpha + _opacity.toString(16).toUpperCase().padStart(2, '0');
}

// Function to get specific palette options for light/dark mode
const getDesignTokens = (mode) => {
  const currentModePalette = mode === 'dark'
    ? { // Dark mode specific overrides
        background: {
          default: '#12181C', // Near-black base from user vision
          paper: basePalette.grey[800], // Darker containers (e.g. #212B36)
        },
        text: {
          primary: basePalette.grey[100], // Off-white text on dark (e.g. #F9FAFB)
          secondary: basePalette.grey[400], // Lighter cool gray (e.g. #C4CDD5)
          disabled: basePalette.grey[600], // (e.g. #637381)
        },
        divider: alpha(basePalette.grey[500], 0.24),
        action: { // Action colors for dark mode
          active: basePalette.grey[500],
          hover: alpha(basePalette.grey[500], 0.08),
          selected: alpha(basePalette.grey[500], 0.16),
          disabled: alpha(basePalette.grey[500], 0.80), // Text disabled
          disabledBackground: alpha(basePalette.grey[500], 0.24), // Component background disabled
          focus: alpha(basePalette.grey[500], 0.24),
          // hoverOpacity, disabledOpacity can remain from basePalette.action if suitable
        }
      }
    : { // Light mode specific overrides (or defaults from basePalette)
        background: {
          default: basePalette.grey[100], // Clean off-white / very light grey (e.g. #F9FAFB)
          paper: '#FFFFFF',   // White for paper elements
        },
        text: {
          primary: basePalette.grey[800], // Dark text for light mode (e.g. #212B36)
          secondary: basePalette.grey[600], // (e.g. #637381)
          disabled: basePalette.grey[500], // (e.g. #919EAB)
        },
        divider: alpha(basePalette.grey[500], 0.24), // Same as basePalette.divider
        action: basePalette.action, // Use action colors defined in basePalette for light mode
      };

  return {
    palette: {
      mode,
      ...basePalette, // Spread the base palette (primary, secondary, grey, etc.)
      ...currentModePalette, // Spread mode-specific overrides (text, background, etc.)
    },
    typography,
    shape,
    // Generate shadows based on the current mode's palette
    // shadows needs palette.grey[500] for light, and a darker grey for dark
    // customShadows needs the full palette for semantic shadows
    shadows: createShadow(mode === 'dark' ? basePalette.grey[700] : basePalette.grey[500]),
    customShadows: createCustomShadow(
        mode === 'dark' ? basePalette.grey[700] : basePalette.grey[500],
        {...basePalette, ...currentModePalette} // Pass the fully merged palette for semantic shadows
    ),
  };
};


SharedThemeProvider.propTypes = {
  children: PropTypes.node,
  mode: PropTypes.oneOf(['light', 'dark']),
};

export default function SharedThemeProvider({ children, mode = 'light' }) {
  const themeOptions = useMemo(() => getDesignTokens(mode), [mode]);
  const theme = createTheme(themeOptions);

  // theme.components = componentsOverride(theme); // To be added in a later step

  return (
    <StyledEngineProvider injectFirst>
      <MUIThemeProvider theme={theme}>
        <CssBaseline /> {/* Ensures baseline styles and dark mode background application */}
        {children}
      </MUIThemeProvider>
    </StyledEngineProvider>
  );
}
