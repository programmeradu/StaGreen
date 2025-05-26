import React from 'react';
import PropTypes from 'prop-types';
import { CircularProgress, Box } from '@mui/material';

const LoadingSpinner = ({ size = 40, sx }) => (
  <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      py: 2, // Default padding, can be overridden by sx prop
      ...sx 
    }}
  >
    <CircularProgress size={size} />
  </Box>
);

LoadingSpinner.propTypes = {
  size: PropTypes.number,
  sx: PropTypes.object
};

export default LoadingSpinner;
