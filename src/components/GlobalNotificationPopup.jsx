import { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

export default function GlobalNotificationPopup() {
  const [open, setOpen] = useState(false);
  const [notification, setNotification] = useState({ message: '', severity: 'info' });

  useEffect(() => {
    // Handler for global errors dispatched by api.js
    const handleError = (e) => {
      setNotification({
        message: e.detail?.message || 'An unexpected error occurred.',
        severity: e.detail?.severity || 'error',
      });
      setOpen(true);
    };

    // Handler for explicit success/info notifications dispatched by components
    const handleSuccess = (e) => {
      setNotification({
        message: e.detail?.message || 'Operation successful.',
        severity: e.detail?.severity || 'success',
      });
      setOpen(true);
    };

    window.addEventListener('api-error', handleError);
    window.addEventListener('app-notification', handleSuccess);

    return () => {
      window.removeEventListener('api-error', handleError);
      window.removeEventListener('app-notification', handleSuccess);
    };
  }, []);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <Snackbar 
      open={open} 
      autoHideDuration={4000} 
      onClose={handleClose} 
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert onClose={handleClose} severity={notification.severity} sx={{ width: '100%', boxShadow: 3, fontWeight: 500 }}>
        {notification.message}
      </Alert>
    </Snackbar>
  );
}
