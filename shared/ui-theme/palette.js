// shared/ui-theme/palette.js

// Define base colors from user vision
const PRIMARY = {
  main: '#006978', // Deep Teal - Example, user might provide exact hex later
  // light: '#4398A8', // Lighter shade of Deep Teal
  // dark: '#003F4D',  // Darker shade of Deep Teal
  // contrastText: '#FFFFFF',
};

const SECONDARY = { // Placeholder, can be refined based on Deep Teal pairing
  main: '#FFC107', // Example: Amber/Gold as a secondary for contrast if needed
  // contrastText: '#000000',
};

const SUCCESS = { main: '#4CAF50' }; // Vibrant Green/Lime (example)
const WARNING = { main: '#FF9800' }; // Amber/Gold
const ERROR = { main: '#F44336' };   // Standard Red, can be refined
const INFO = { main: '#2196F3' };    // Sky Blue

// Neutrals for Dark Mode
const DARK_BACKGROUND = {
  default: '#12181C', // Near-black base
  paper: '#1A2228',   // Slightly lighter for paper elements
};
const DARK_TEXT = {
  primary: '#E0E0E0', // Cool gray for primary text
  secondary: '#B0B0B0',// Lighter cool gray
  disabled: '#757575',
};

// Neutrals for Light Mode
const LIGHT_BACKGROUND = {
  default: '#F4F6F8', // Clean off-white / very light grey
  paper: '#FFFFFF',   // White for paper elements
};
const LIGHT_TEXT = {
  primary: '#212B36',
  secondary: '#637381',
  disabled: '#919EAB',
};

// ACCENT COLORS (from user vision, can be integrated into palette or used directly)
const ACCENT_GREEN_LIME = '#8BC34A'; // Example
const ACCENT_AMBER_GOLD = WARNING.main; // Reuse from semantic
const ACCENT_SKY_BLUE = INFO.main;    // Reuse from semantic
const ACCENT_CORAL = '#FF7F50';       // Example

const commonPalette = {
  primary: { ...PRIMARY, contrastText: '#FFFFFF' }, // Added contrastText for primary
  secondary: { ...SECONDARY, contrastText: '#000000' }, // Added contrastText for secondary
  success: { ...SUCCESS, contrastText: '#fff' },
  warning: { ...WARNING, contrastText: DARK_TEXT.primary }, // Assuming dark text on warning
  error: { ...ERROR, contrastText: '#fff' },
  info: { ...INFO, contrastText: '#fff' },
  common: { black: '#000', white: '#fff' },
  action: {
    hover: 'rgba(0, 0, 0, 0.04)',
    selected: 'rgba(0, 0, 0, 0.08)',
    disabled: 'rgba(0, 0, 0, 0.26)',
    disabledBackground: 'rgba(0, 0, 0, 0.12)',
    focus: 'rgba(0, 0, 0, 0.12)',
  },
};

// Palette for Light Mode
const lightPalette = {
  ...commonPalette,
  mode: 'light',
  text: LIGHT_TEXT,
  background: LIGHT_BACKGROUND,
  action: {
    ...commonPalette.action,
    active: 'rgba(0,0,0,0.1)'
  }
};

// Palette for Dark Mode
const darkPalette = {
  ...commonPalette,
  mode: 'dark',
  text: DARK_TEXT,
  background: DARK_BACKGROUND,
  action: {
    ...commonPalette.action,
    active: 'rgba(255,255,255,0.1)'
  }
};

export { lightPalette, darkPalette, PRIMARY, SECONDARY, ACCENT_GREEN_LIME, ACCENT_AMBER_GOLD, ACCENT_SKY_BLUE, ACCENT_CORAL };
