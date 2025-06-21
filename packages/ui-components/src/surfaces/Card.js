// packages/ui-components/src/surfaces/Card.js
import React from 'react';
import { Card as MuiCard, CardContent as MuiCardContent, CardHeader as MuiCardHeader, CardActions as MuiCardActions, Typography, Box } from '@mui/material';
import PropTypes from 'prop-types';

const Card = ({ title, subheader, children, actions, cardSx, headerSx, contentSx, actionsSx, titleVariant = "h6", ...props }) => {
  return (
    <MuiCard sx={{ boxShadow: (theme) => theme.customShadows ? theme.customShadows.card : 3, ...cardSx }} {...props}>
      {(title || subheader) && (
        <MuiCardHeader
          title={title ? <Typography variant={titleVariant}>{title}</Typography> : null}
          subheader={subheader ? <Typography variant="body2" color="text.secondary">{subheader}</Typography> : null}
          sx={headerSx}
        />
      )}
      <MuiCardContent sx={contentSx}>
        {children}
      </MuiCardContent>
      {actions && (
        <Box sx={{ flexGrow: 1, ...actionsSx }}>
          <MuiCardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
            {actions}
          </MuiCardActions>
        </Box>
      )}
    </MuiCard>
  );
};

Card.propTypes = {
  title: PropTypes.node,
  subheader: PropTypes.node,
  children: PropTypes.node.isRequired,
  actions: PropTypes.node, // Typically a Box or Fragment containing Buttons
  cardSx: PropTypes.object,
  headerSx: PropTypes.object,
  contentSx: PropTypes.object,
  actionsSx: PropTypes.object,
  titleVariant: PropTypes.string,
};

export default Card;
