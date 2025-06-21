// packages/ui-theme/palette.js
const PRIMARY = {
  main: '#006970', // Deep Teal (example, can be refined)
  light: '#43989F', // Lighter shade of Deep Teal
  dark: '#003F45',  // Darker shade of Deep Teal
  contrastText: '#FFFFFF',
};

const SECONDARY = { // Define a secondary if needed, or use primary for most actions
  main: '#FFC107', // Amber/Gold for alerts/warnings could be secondary or a specific warning color
  contrastText: '#000000',
};

const SUCCESS = {
  main: '#4CAF50', // Vibrant Green/Lime (example)
  contrastText: '#FFFFFF',
};

const WARNING = {
  main: '#FF9800', // Amber/Gold
  contrastText: '#000000', // Text on amber might need to be dark
};

const ERROR = {
  main: '#F44336', // Standard Error Red
  contrastText: '#FFFFFF',
};

const INFO = {
  main: '#03A9F4', // Sky Blue
  contrastText: '#FFFFFF',
};

const CORAL_ACCENT = { // For specific accents like StaCircular
    main: '#FF7F50', // Coral
    contrastText: '#FFFFFF',
};

const GREY = { // Shades of cool gray for text and elements
  0: '#FFFFFF',
  100: '#F9FAFB', // Off-white for light mode background (very light grey)
  200: '#F4F6F8', // Light gray containers (light mode) - Clean off-white / very light grey
  300: '#DFE3E8',
  400: '#C4CDD5',
  500: '#919EAB', // For disabled states and secondary text
  600: '#637381', // For secondary text
  700: '#454F5B',
  800: '#212B36', // For primary text (light mode)
  900: '#161C24',
  // Near-black base for dark mode background: '#12181C' (between 800 and 900)
};

// Helper function to add alpha to hex colors
function alpha(color, opacity) {
  if (!color || !color.startsWith('#') || color.length !== 7) { // Basic check for #RRGGBB format
    // console.warn(`Invalid color format for alpha function: ${color}`);
    return color; // Return original if not a valid hex for this simple alpha function
  }
  const _opacity = Math.round(Math.min(Math.max(opacity || 1, 0), 1) * 255);
  return color + _opacity.toString(16).toUpperCase().padStart(2, '0');
}

const simplerPalette = {
  common: { black: '#000', white: '#fff' },
  primary: PRIMARY,
  secondary: SECONDARY,
  success: SUCCESS,
  warning: WARNING,
  error: ERROR,
  info: INFO,
  coralAccent: CORAL_ACCENT,
  grey: GREY,
  // These will be used as defaults for 'light' mode,
  // and ThemeProvider's getDesignTokens will override for 'dark' mode.
  text: {
    primary: GREY[800],
    secondary: GREY[600],
    disabled: GREY[500],
  },
  background: {
    paper: '#FFFFFF', // White for paper elements in light mode
    default: GREY[100], // Clean off-white / very light grey background in light mode
  },
  divider: alpha(GREY[500], 0.24),
  action: {
    active: GREY[600], // Slightly darker for active state
    hover: alpha(GREY[500], 0.08), // Light hover
    selected: alpha(GREY[500], 0.16), // Slightly more prominent selection
    disabled: alpha(GREY[500], 0.80), // More visible disabled text on components
    disabledBackground: alpha(GREY[500], 0.24), // Background for disabled components
    focus: alpha(GREY[500], 0.24), // Focus ring/highlight
    hoverOpacity: 0.08, // Standard MUI values
    disabledOpacity: 0.48, // Standard MUI values
  },
};

export default simplerPalette;
