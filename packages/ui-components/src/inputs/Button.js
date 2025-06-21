// packages/ui-components/src/inputs/Button.js
import React from 'react';
import { Button as MuiButton } from '@mui/material';
import PropTypes from 'prop-types';

// This component can be expanded to include custom StaGreen variants
// For now, it primarily ensures consistent styling and prop handling
// It will inherit styling from the SharedThemeProvider.
const Button = ({ children, variant = 'contained', color = 'primary', sx, ...props }) => {
  return (
    <MuiButton
      variant={variant}
      color={color}
      sx={sx}
      {...props}
    >
      {children}
    </MuiButton>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['text', 'outlined', 'contained']),
  color: PropTypes.oneOf([
    'inherit',
    'primary',
    'secondary',
    'success',
    'error',
    'info',
    'warning',
    'coralAccent' // Include custom palette color if defined and to be used directly
  ]),
  sx: PropTypes.object,
};

export default Button;
