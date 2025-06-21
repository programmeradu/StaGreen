// packages/ui-components/src/layouts/PageLayout.js
import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import PropTypes from 'prop-types';
// import { Helmet } from 'react-helmet-async'; // Would be good to add this to ui-components package.json if used

const PageLayout = ({ children, title, titleVariant = "h4", maxWidth = "lg", sx, ...props }) => {
  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: 3, // Default vertical padding
        ...sx
      }}
      {...props}
    >
      {/* <Helmet>
        <title>{title ? `${title} | StaGreen` : 'StaGreen'}</title>
      </Helmet> */}

      <Container maxWidth={maxWidth}>
        {title && (
          <Typography variant={titleVariant} component="h1" gutterBottom sx={{ mb: 3 }}>
            {title}
          </Typography>
        )}
        {children}
      </Container>
    </Box>
  );
};

PageLayout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  titleVariant: PropTypes.string,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', false]),
  sx: PropTypes.object,
};

export default PageLayout;
