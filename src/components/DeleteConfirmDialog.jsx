import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Divider, CircularProgress } from '@mui/material';

/**
 * Reusable dialog for confirming deletions.
 *
 * @param {boolean} open - Controls dialog open state
 * @param {function} onClose - Called when Cancel is clicked or dialog closed
 * @param {function} onConfirm - Called when Delete is clicked
 * @param {string} [title="Confirm Deletion"] - Custom title for the dialog
 * @param {string} [itemType="item"] - Singular noun of what is being deleted (e.g. "status")
 * @param {string} [itemTypePlural] - Plural noun of what is being deleted (defaults to itemType + "s")
 * @param {number} [count=1] - Number of items selected for deletion
 * @param {boolean} [isLoading=false] - If true, disables buttons and shows loader
 * @param {string|React.ReactNode} [message] - If specified, overrides default message generation
 */
export default function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  itemType = 'item',
  itemTypePlural,
  count = 1,
  isLoading = false,
  message,
}) {
  const pluralSuffix = itemTypePlural || (itemType.endsWith('y') ? `${itemType.slice(0, -1)}ies` : `${itemType}s`);
  const defaultMessage = count === 1
    ? `Are you sure you want to delete this ${itemType}? This action cannot be undone.`
    : `Are you sure you want to delete these ${count} ${pluralSuffix}? This action cannot be undone.`;

  return (
    <Dialog 
      open={open} 
      onClose={isLoading ? undefined : onClose} 
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>
        {title}
      </DialogTitle>
      <Divider />
      <DialogContent>
        <DialogContentText>
          {message || defaultMessage}
        </DialogContentText>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={onClose} 
          color="inherit" 
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error" 
          variant="contained" 
          disabled={isLoading} 
          sx={{ minWidth: 90 }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
