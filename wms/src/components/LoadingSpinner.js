import React from 'react'
import { CircularProgress, Box } from '@mui/material'

const LoadingSpinner = ({ size = 40, sx }) => {
  return (
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
  )
}

export default LoadingSpinner
