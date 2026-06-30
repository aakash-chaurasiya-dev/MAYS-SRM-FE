import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Box, Typography, Paper, Divider, TextField } from '@mui/material';
import { useTheme } from '@mui/material/styles';

/**
 * TicketIssue
 * 
 * Manages the display and editing of the ticket's issue description.
 */
const TicketIssue = forwardRef(({ ticket, isEditMode }, ref) => {
  const theme = useTheme();
  
  const [tempDescription, setTempDescription] = useState('');
  
  useEffect(() => {
    if (isEditMode) {
      setTempDescription(ticket?.ticketDescription || '');
    }
  }, [isEditMode, ticket]);

  useImperativeHandle(ref, () => ({
    getFormData: () => ({
      ticketDescription: tempDescription,
    })
  }));

  const issueDescription = ticket?.ticketDescription || 'Not available';

  return (
    <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
      <Box sx={{ px: 2.5, py: 1.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Issue Description</Typography>
      </Box>
      <Divider />
      <Box sx={{ p: 2.5 }}>
        {isEditMode ? (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={tempDescription}
            onChange={(e) => setTempDescription(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
          />
        ) : (
            <Typography sx={{ fontSize: '13px', paddingLeft:'3px', color: theme.palette.text.primary, lineHeight: 1.7, fontStyle: issueDescription === 'Not available' ? 'normal' : 'italic' }}>
              {issueDescription}
            </Typography>
        )}
      </Box>
    </Paper>
  );
});

export default TicketIssue;
