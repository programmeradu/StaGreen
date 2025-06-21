// shared/ui-theme/typography.js
// Helper function to respond to screen sizes
function responsiveFontSizes({ sm, md, lg }) {
  return {
    '@media (min-width:600px)': { fontSize: sm },
    '@media (min-width:900px)': { fontSize: md },
    '@media (min-width:1200px)': { fontSize: lg },
  };
}

// For a clean, data-rich interface, prioritize clarity and readability.
// Google Fonts to consider if not using system defaults: 'Inter', 'Roboto', 'Open Sans'
// Let's assume 'Roboto' for now as it's often a default with MUI.
const FONT_PRIMARY = 'Roboto, sans-serif'; // Or 'Inter, sans-serif' for a very modern feel

const typography = {
  fontFamily: FONT_PRIMARY,
  fontWeightRegular: 400,
  fontWeightMedium: 600, // Slightly bolder for medium emphasis
  fontWeightBold: 700,   // Standard bold

  h1: {
    fontWeight: 700,
    lineHeight: 80 / 64,
    fontSize: '2.5rem', // Example size
    ...responsiveFontSizes({ sm: '3rem', md: '3.5rem', lg: '4rem' }),
  },
  h2: {
    fontWeight: 700,
    lineHeight: 64 / 48,
    fontSize: '2rem',
    ...responsiveFontSizes({ sm: '2.25rem', md: '2.75rem', lg: '3rem' }),
  },
  h3: {
    fontWeight: 700,
    lineHeight: 1.5,
    fontSize: '1.5rem',
    ...responsiveFontSizes({ sm: '1.625rem', md: '1.75rem', lg: '2rem' }),
  },
  h4: {
    fontWeight: 700, // Bolder for clarity in data-dense UIs
    lineHeight: 1.5,
    fontSize: '1.25rem',
    ...responsiveFontSizes({ sm: '1.25rem', md: '1.375rem', lg: '1.5rem' }),
  },
  h5: {
    fontWeight: 600,
    lineHeight: 1.5,
    fontSize: '1.125rem',
    ...responsiveFontSizes({ sm: '1.125rem', md: '1.25rem', lg: '1.25rem' }),
  },
  h6: {
    fontWeight: 600, // Medium weight for subheadings
    lineHeight: 28 / 18,
    fontSize: '1rem',
    ...responsiveFontSizes({ sm: '1rem', md: '1.125rem', lg: '1.125rem' }),
  },
  subtitle1: {
    fontWeight: 600,
    lineHeight: 1.5,
    fontSize: '1rem',
  },
  subtitle2: {
    fontWeight: 500, // Normal weight for less emphasis
    lineHeight: 22 / 14,
    fontSize: '0.875rem',
  },
  body1: {
    lineHeight: 1.5,
    fontSize: '1rem', // Standard body text
  },
  body2: {
    lineHeight: 22 / 14,
    fontSize: '0.875rem', // Slightly smaller body text for secondary info
  },
  caption: {
    lineHeight: 1.5,
    fontSize: '0.75rem',
  },
  overline: {
    fontWeight: 700,
    lineHeight: 1.5,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
  },
  button: {
    fontWeight: 600, // Buttons slightly bolder
    lineHeight: 24 / 14,
    fontSize: '0.875rem',
    textTransform: 'capitalize', // Or 'none' or 'uppercase' based on style
  },
};

export default typography;
