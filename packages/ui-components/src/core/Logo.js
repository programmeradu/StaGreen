// packages/ui-components/src/core/Logo.js
import React from 'react';
import { Box, Typography } from '@mui/material';
// import { Link as RouterLink } from 'react-router-dom'; // If it needs to be a link

// Placeholder for an actual SVG logo if available
// import { ReactComponent as StaGreenLogoSvg } from './stargreen-logo.svg';

const Logo = ({ sx, disabledLink = false }) => {
  const logo = (
    <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
      {/* Placeholder for SVG logo: <StaGreenLogoSvg height={40} /> */}
      <Typography variant="h4" component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        StaG
      </Typography>
      <Typography variant="h4" component="span" sx={{ fontWeight: 'bold', color: 'success.main' }}>
        reen
      </Typography>
    </Box>
  );

  if (disabledLink) {
    return <>{logo}</>;
  }

  // If you want the logo to be a link to homepage, uncomment and adjust
  // return <RouterLink to="/">{logo}</RouterLink>;
  return <>{logo}</>; // For now, just the visual
};

export default Logo;
