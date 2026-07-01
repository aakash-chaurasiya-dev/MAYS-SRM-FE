import React from 'react';
import { Backdrop, CircularProgress, Typography, Box } from '@mui/material';
import { useGlobalLoading } from '../contexts/GlobalLoadingContext';

const GlobalLoading = () => {
  const { isLoading, loadingText } = useGlobalLoading();

  return (
    <Backdrop
      sx={{ 
        color: '#fff', 
        zIndex: (theme) => theme.zIndex.drawer + 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}
      open={isLoading}
    >
      <CircularProgress color="inherit" />
      {loadingText && (
        <Typography variant="h6" component="div">
          {loadingText}
        </Typography>
      )}
    </Backdrop>
  );
};

export default GlobalLoading;
