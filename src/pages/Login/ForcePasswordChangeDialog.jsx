import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api'; // adjust to your axios instance path

export default function ForceChangePasswordDialog({
  open,
  mobileNo,
  onClose,
  onSuccess,
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');

  // ── Reset everything when the dialog closes ──
  const resetState = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setError('');
  };

  // ── TanStack Query mutation ──
  const mutation = useMutation({
    mutationFn: (payload) => api.post('/auth/force-change-password', payload),
    onSuccess: () => {
      resetState();
      onSuccess?.();
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to change password. Please try again.';
      setError(msg);
    },
  });

  const isBusy = mutation.isPending;

  const handleClose = () => {
    if (isBusy) return;
    resetState();
    onClose?.();
  };

  // ── Client-side validation before firing the mutation ──
  const validate = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return 'All fields are required.';
    }
    if (newPassword.length < 8) {
      return 'New password must be at least 8 characters.';
    }
    if (newPassword === currentPassword) {
      return 'New password must be different from your current password.';
    }
    if (newPassword !== confirmPassword) {
      return 'New passwords do not match.';
    }
    return null;
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    mutation.mutate({
      mobileNo,
      currentPassword,
      newPassword,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isBusy}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>Change your password</DialogTitle>

      <DialogContent dividers>
        <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: 2 }}>
          This is your first login. For security reasons, you must set a new
          password before continuing.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            size="small"
            label="Current Password"
            type={showCurrent ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isBusy}
            autoComplete="current-password"
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowCurrent((s) => !s)}
                      edge="end"
                      tabIndex={-1}
                    >
                      {showCurrent ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            fullWidth
            size="small"
            label="New Password"
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isBusy}
            autoComplete="new-password"
            helperText="Minimum 8 characters."
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowNew((s) => !s)}
                      edge="end"
                      tabIndex={-1}
                    >
                      {showNew ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            fullWidth
            size="small"
            label="Confirm New Password"
            type={showNew ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isBusy}
            autoComplete="new-password"
          />

          {/* Hidden submit so Enter key works */}
          <Box sx={{ display: 'none' }}>
            <button type="submit" />
          </Box>
        </form>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={isBusy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isBusy}
          startIcon={isBusy ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {isBusy ? 'Saving...' : 'Change Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}