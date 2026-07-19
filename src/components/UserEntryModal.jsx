import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Radio, RadioGroup, FormControlLabel, FormControl, TextField, Typography, CircularProgress } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function UserEntryModal({ open, onClose }) {
  const { user } = useAuth();
  const [reason, setReason] = useState('Inward');
  const [customReason, setCustomReason] = useState('');

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      return api.post('/user-entry-reports', payload);
    },
    onSuccess: () => {
      sessionStorage.setItem('hasAnsweredHereFor', 'true');
      onClose();
    },
    onError: (error) => {
      console.error('Failed to submit entry:', error);
    }
  });

  const handleSubmit = () => {
    const finalReason = reason === 'Others' ? customReason : reason;
    if (!finalReason.trim()) return;

    submitMutation.mutate({
      userId: user?.userId,
      reason: finalReason
    });
  };

  return (
    <Dialog open={open} maxWidth="xs" fullWidth disableEscapeKeyDown>
      <DialogTitle sx={{ fontWeight: 600, borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        Here for..
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Please select the reason for your login today:
        </Typography>
        <FormControl component="fieldset" fullWidth>
          <RadioGroup
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <FormControlLabel value="Inward" control={<Radio />} label="Inward" />
            <FormControlLabel value="Outward" control={<Radio />} label="Outward" />
            <FormControlLabel value="Enquiry" control={<Radio />} label="Enquiry" />
            <FormControlLabel value="Ticket Status Check" control={<Radio />} label="Ticket Status Check" />
            <FormControlLabel value="Others" control={<Radio />} label="Others" />
          </RadioGroup>
        </FormControl>

        {reason === 'Others' && (
          <TextField
            fullWidth
            size="small"
            placeholder="Please specify your reason..."
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            sx={{ mt: 2 }}
            autoFocus
          />
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          disabled={submitMutation.isPending || (reason === 'Others' && !customReason.trim())}
        >
          {submitMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
