import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Box, Typography, Button, Paper, Divider, TextField } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * TicketInternalUpdate
 * 
 * Allows staff to post internal notes/updates without changing ticket status.
 */
const TicketInternalUpdate = forwardRef(({ ticket, ticketId }, ref) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [internalNote, setInternalNote] = useState('');

  useImperativeHandle(ref, () => ({
    getFormData: () => ({
      remarks: internalNote.trim() ? internalNote.trim() : null,
    }),
    clearNote: () => {
      setInternalNote('');
    }
  }));

  const postNoteMutation = useMutation({
    mutationFn: async () => {
      const updatedTicket = {
        ...ticket,
        modifiedByEmployeeId: user?.userId || null,
        remarks: internalNote.trim(),
      };
      console.log('Posting Internal Note Payload:', { remarks: internalNote.trim() });
      const response = await api.patch(`/tickets/${ticketId}`, updatedTicket);
      return response.data;
    },
    onSuccess: () => {
      setInternalNote('');
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: { message: 'Internal update posted successfully!', severity: 'success' }
      }));
      
      // Instantly refresh ticket and logs across the UI
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket-logs', ticketId] });
    },
    onError: (err) => {
      console.error('Failed to post internal note', err);
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: { message: err.response?.data?.message || 'Unable to post internal note', severity: 'error' }
      }));
    }
  });

  const handlePostNote = () => {
    if (!internalNote.trim()) return;
    postNoteMutation.mutate();
  };

  return (
    <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
      <Box sx={{ px: 2.5, py: 1.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Post Internal Update</Typography>
        <Button 
          size="small" 
          variant="contained" 
          sx={{ fontSize: '11px', minWidth: 0, p: '2px 10px' }} 
          onClick={handlePostNote} 
          disabled={postNoteMutation.isPending || !internalNote.trim()}
        >
          {postNoteMutation.isPending ? 'Posting...' : 'Post'}
        </Button>
      </Box>
      <Divider />
      <Box sx={{ p: 2.5 }}>
        <TextField 
          fullWidth 
          multiline 
          rows={3} 
          placeholder="Add an internal note or status update…" 
          value={internalNote}
          onChange={(e) => setInternalNote(e.target.value)}
          disabled={postNoteMutation.isPending}
          sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }} 
        />
      </Box>
    </Paper>
  );
});

export default TicketInternalUpdate;
