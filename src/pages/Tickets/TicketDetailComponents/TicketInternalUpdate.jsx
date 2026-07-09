import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Box, Typography, Paper, Divider, TextField } from '@mui/material';


/**
 * TicketInternalUpdate
 * 
 * Allows staff to post internal notes/updates without changing ticket status.
 */
const TicketInternalUpdate = forwardRef(({isEditMode, latestRemark }, ref) => {

  
  const [internalNote, setInternalNote] = useState('');

  useImperativeHandle(ref, () => ({
    getFormData: () => ({
      remarks: internalNote.trim() ? internalNote.trim() : null,
    }),
    clearNote: () => {
      setInternalNote('');
    }
  }));



  return (
    <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
      <Box sx={{ px: 2.5, py: 1.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
          {isEditMode ? 'Add Internal Update' : 'Latest Internal Update'}
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ p: 2.5 }}>
        {isEditMode ? (
          <TextField 
            fullWidth 
            multiline 
            rows={3} 
            placeholder="Add an internal note or status update…" 
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }} 
          />
        ) : (
          <Typography sx={{ fontSize: '13px', color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
            {latestRemark || 'No internal updates yet.'}
          </Typography>
        )}
      </Box>
    </Paper>
  );
});

export default TicketInternalUpdate;
