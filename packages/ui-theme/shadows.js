// material
import { alpha } from '@mui/material/styles';
// import palette from './palette'; // This will need to be adjusted or palette passed in

// ----------------------------------------------------------------------

// const LIGHT_MODE = palette.grey[500]; // Placeholder, will be based on theme's grey

// Default to a generic grey for now, ThemeProvider will pass the correct one.
const DEFAULT_GREY_FOR_SHADOWS = '#919EAB'; // Corresponds to GREY[500]

const createShadow = (color = DEFAULT_GREY_FOR_SHADOWS) => { // Allow color to be passed
  const transparent1 = alpha(color, 0.2);
  const transparent2 = alpha(color, 0.14);
  const transparent3 = alpha(color, 0.12);
  return [
    'none',
    `0px 2px 1px -1px ${transparent1},0px 1px 1px 0px ${transparent2},0px 1px 3px 0px ${transparent3}`,
    `0px 3px 1px -2px ${transparent1},0px 2px 2px 0px ${transparent2},0px 1px 5px 0px ${transparent3}`,
    `0px 3px 3px -2px ${transparent1},0px 3px 4px 0px ${transparent2},0px 1px 8px 0px ${transparent3}`,
    `0px 2px 4px -1px ${transparent1},0px 4px 5px 0px ${transparent2},0px 1px 10px 0px ${transparent3}`,
    `0px 3px 5px -1px ${transparent1},0px 5px 8px 0px ${transparent2},0px 1px 14px 0px ${transparent3}`,
    `0px 3px 5px -1px ${transparent1},0px 6px 10px 0px ${transparent2},0px 1px 18px 0px ${transparent3}`,
    `0px 4px 5px -2px ${transparent1},0px 7px 10px 1px ${transparent2},0px 2px 16px 1px ${transparent3}`,
    `0px 5px 5px -3px ${transparent1},0px 8px 10px 1px ${transparent2},0px 3px 14px 2px ${transparent3}`,
    `0px 5px 6px -3px ${transparent1},0px 9px 12px 1px ${transparent2},0px 3px 16px 2px ${transparent3}`,
    `0px 6px 6px -3px ${transparent1},0px 10px 14px 1px ${transparent2},0px 4px 18px 3px ${transparent3}`,
    `0px 6px 7px -4px ${transparent1},0px 11px 15px 1px ${transparent2},0px 4px 20px 3px ${transparent3}`,
    `0px 7px 8px -4px ${transparent1},0px 12px 17px 2px ${transparent2},0px 5px 22px 4px ${transparent3}`,
    `0px 7px 8px -4px ${transparent1},0px 13px 19px 2px ${transparent2},0px 5px 24px 4px ${transparent3}`,
    `0px 7px 9px -4px ${transparent1},0px 14px 21px 2px ${transparent2},0px 5px 26px 4px ${transparent3}`,
    `0px 8px 9px -5px ${transparent1},0px 15px 22px 2px ${transparent2},0px 6px 28px 5px ${transparent3}`,
    `0px 8px 10px -5px ${transparent1},0px 16px 24px 2px ${transparent2},0px 6px 30px 5px ${transparent3}`,
    `0px 8px 11px -5px ${transparent1},0px 17px 26px 2px ${transparent2},0px 6px 32px 5px ${transparent3}`,
    `0px 9px 11px -5px ${transparent1},0px 18px 28px 2px ${transparent2},0px 7px 34px 6px ${transparent3}`,
    `0px 9px 12px -6px ${transparent1},0px 19px 29px 2px ${transparent2},0px 7px 36px 6px ${transparent3}`,
    `0px 10px 13px -6px ${transparent1},0px 20px 31px 3px ${transparent2},0px 8px 38px 7px ${transparent3}`,
    `0px 10px 13px -6px ${transparent1},0px 21px 33px 3px ${transparent2},0px 8px 40px 7px ${transparent3}`,
    `0px 10px 14px -6px ${transparent1},0px 22px 35px 3px ${transparent2},0px 8px 42px 7px ${transparent3}`,
    `0px 11px 14px -7px ${transparent1},0px 23px 36px 3px ${transparent2},0px 9px 44px 8px ${transparent3}`,
    `0px 11px 15px -7px ${transparent1},0px 24px 38px 3px ${transparent2},0px 9px 46px 8px ${transparent3}`,
  ];
};

// createCustomShadow will also need the palette passed in or use default values
const createCustomShadow = (color = DEFAULT_GREY_FOR_SHADOWS, paletteRef) => {
  const transparent = alpha(color, 0.24);

  // If paletteRef is provided, use its colors, otherwise fallback to simple alphas or defaults
  const primaryMain = paletteRef && paletteRef.primary ? paletteRef.primary.main : '#006970'; // Default primary
  const secondaryMain = paletteRef && paletteRef.secondary ? paletteRef.secondary.main : '#FFC107'; // Default secondary
  const infoMain = paletteRef && paletteRef.info ? paletteRef.info.main : '#03A9F4';
  const successMain = paletteRef && paletteRef.success ? paletteRef.success.main : '#4CAF50';
  const warningMain = paletteRef && paletteRef.warning ? paletteRef.warning.main : '#FF9800';
  const errorMain = paletteRef && paletteRef.error ? paletteRef.error.main : '#F44336';


  return {
    z1: `0 1px 2px 0 ${transparent}`,
    z8: `0 8px 16px 0 ${transparent}`,
    z12: `0 0 2px 0 ${transparent}, 0 12px 24px 0 ${transparent}`,
    z16: `0 0 2px 0 ${transparent}, 0 16px 32px -4px ${transparent}`,
    z20: `0 0 2px 0 ${transparent}, 0 20px 40px -4px ${transparent}`,
    z24: `0 0 4px 0 ${transparent}, 0 24px 48px 0 ${transparent}`,
    primary: `0 8px 16px 0 ${alpha(primaryMain, 0.24)}`,
    secondary: `0 8px 16px 0 ${alpha(secondaryMain, 0.24)}`,
    info: `0 8px 16px 0 ${alpha(infoMain, 0.24)}`,
    success: `0 8px 16px 0 ${alpha(successMain, 0.24)}`,
    warning: `0 8px 16px 0 ${alpha(warningMain, 0.24)}`,
    error: `0 8px 16px 0 ${alpha(errorMain, 0.24)}`,
  };
};

// Export functions that can be called with the theme's palette by the ThemeProvider
export { createShadow, createCustomShadow };

// Default exports for direct use if no palette is passed (less ideal but provides fallback)
const defaultShadows = createShadow();
const defaultCustomShadows = createCustomShadow();

export { defaultShadows as shadows, defaultCustomShadows as customShadows };
// This structure allows the ThemeProvider (index.js) to generate shadows using the actual theme palette.
export default defaultShadows; // default export for shadows array
