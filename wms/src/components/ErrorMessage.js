import React from 'react';
import { Alert, AlertTitle } from '@mui/material';

const ErrorMessage = ({ error, title, sx }) => { // Added sx prop
  if (!error || (typeof error === 'object' && !error.message && !error.error)) {
    // If error is null, or an object without a message or error property, don't render
    // This handles cases where error state might be an empty object initially
    if (typeof error === 'string' && error.trim() === '') { // Also check for empty string
        return null;
    }
    if (!error) return null; // Explicitly return null if error is falsy (null, undefined, empty string)
  }


  let displayMessage = 'An unexpected error occurred.';
  if (typeof error === 'string' && error.trim() !== '') {
    displayMessage = error;
  } else if (error && typeof error.message === 'string') {
    displayMessage = error.message;
  } else if (error && typeof error.error === 'string') { // For backend errors like { error: "message" }
    displayMessage = error.error;
  } else if (typeof error === 'object' && Object.keys(error).length === 0) {
    // If error is an empty object, do not render anything or use a default.
    // This case should ideally be caught by the initial check, but as a safeguard.
    return null; 
  }


  // Final check to ensure we have something meaningful to display
  if (displayMessage === 'An unexpected error occurred.' && !(typeof error === 'string' && error.trim() !== '')) {
      // If we are about to display the generic message, but the error object itself was empty or non-informative
      // it might be better not to render anything, or log this specific case.
      // For now, we'll proceed to render the generic message if no specific message could be extracted.
      // However, if the error prop itself was truly empty (e.g. an empty string passed initially), the first check should catch it.
  }


  return (
    <Alert severity="error" sx={{ my: 2, ...sx }}> {/* Default margin, can be overridden by sx prop */}
      {title && <AlertTitle>{title}</AlertTitle>}
      {displayMessage}
    </Alert>
  );
};

export default ErrorMessage;
