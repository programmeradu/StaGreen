// packages/ui-theme/typography.js
// Assuming standard font setup. If custom fonts are needed, they should be loaded via CSS.
// This configuration primarily adjusts sizes, weights, and line heights.

function pxToRem(value) {
  return `${value / 16}rem`;
}

function responsiveFontSizes({ sm, md, lg }) {
  return {
    '@media (min-width:600px)': {
      fontSize: pxToRem(sm),
    },
    '@media (min-width:900px)': {
      fontSize: pxToRem(md),
    },
    '@media (min-width:1200px)': {
      fontSize: pxToRem(lg),
    },
  };
}

const FONT_PRIMARY = 'Public Sans, sans-serif'; // Example font, similar to what minimal themes use. User might specify.
// To use 'Roboto', ensure it's imported in your main HTML or via CSS @import
// const FONT_PRIMARY = 'Roboto, sans-serif';

const typography = {
  fontFamily: FONT_PRIMARY,
  fontWeightRegular: 400,
  fontWeightMedium: 600, // User vision: Slightly bolder for medium emphasis
  fontWeightBold: 700,   // User vision: Standard bold

  h1: {
    fontWeight: 700,
    lineHeight: 80 / 64, // From Minimal UI
    fontSize: pxToRem(40), // Base size
    ...responsiveFontSizes({ sm: 52, md: 58, lg: 64 }),
  },
  h2: {
    fontWeight: 700,
    lineHeight: 64 / 48, // From Minimal UI
    fontSize: pxToRem(32),
    ...responsiveFontSizes({ sm: 40, md: 44, lg: 48 }),
  },
  h3: {
    fontWeight: 700,
    lineHeight: 1.5,
    fontSize: pxToRem(24),
    ...responsiveFontSizes({ sm: 26, md: 30, lg: 32 }),
  },
  h4: { // User vision: Bolder for clarity in data-dense UIs
    fontWeight: 700,
    lineHeight: 1.5,
    fontSize: pxToRem(20),
    ...responsiveFontSizes({ sm: 20, md: 24, lg: 24 }),
  },
  h5: { // User vision: Bolder (using 700, or 600 if h4 is very bold)
    fontWeight: 700, // Let's try bold for h5 as well, can be 600 if too much
    lineHeight: 1.5,
    fontSize: pxToRem(18),
    ...responsiveFontSizes({ sm: 19, md: 20, lg: 20 }),
  },
  h6: { // User vision: Medium weight for subheadings
    fontWeight: 600,
    lineHeight: 28 / 18, // From Minimal UI
    fontSize: pxToRem(17),
    ...responsiveFontSizes({ sm: 18, md: 18, lg: 18 }),
  },
  subtitle1: {
    fontWeight: 600,
    lineHeight: 1.5,
    fontSize: pxToRem(16),
  },
  subtitle2: {
    fontWeight: 600, // User vision: Normal weight for less emphasis (changed from 500 to 600 for more presence)
    lineHeight: 22 / 14, // From Minimal UI
    fontSize: pxToRem(14),
  },
  body1: { // User vision: Standard body text
    lineHeight: 1.5,
    fontSize: pxToRem(16),
    fontWeight: 400,
  },
  body2: { // User vision: Slightly smaller body text for secondary info
    lineHeight: 22 / 14, // From Minimal UI
    fontSize: pxToRem(14),
    fontWeight: 400,
  },
  caption: {
    lineHeight: 1.5,
    fontSize: pxToRem(12),
    fontWeight: 400,
  },
  overline: {
    fontWeight: 700,
    lineHeight: 1.5,
    fontSize: pxToRem(12),
    textTransform: 'uppercase',
  },
  button: { // User vision: Buttons slightly bolder
    fontWeight: 600,
    lineHeight: 24 / 14, // From Minimal UI
    fontSize: pxToRem(14),
    textTransform: 'capitalize', // Per user vision (Stripe-like often uses this or none)
  },
};

export default typography;
