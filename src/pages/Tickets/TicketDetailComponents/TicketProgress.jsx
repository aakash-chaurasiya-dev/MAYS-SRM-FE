import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Box, Typography, LinearProgress, Paper, TextField } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const TicketProgress = forwardRef(({ ticket, isEditMode }, ref) => {
  const theme = useTheme();
  
  // State for the editable target date
  const [targetDateStr, setTargetDateStr] = useState('');

  useEffect(() => {
    if (isEditMode) {
      // slice(0, 16) formats ISO string to "YYYY-MM-DDTHH:mm" for datetime-local input
      setTargetDateStr(ticket?.targetDate ? ticket.targetDate.slice(0, 16) : '');
    } else {
      setTargetDateStr(ticket?.targetDate || '');
    }
  }, [isEditMode, ticket]);

  useImperativeHandle(ref, () => ({
    getFormData: () => ({
      targetDate: targetDateStr ? targetDateStr + (targetDateStr.length === 16 ? ':00' : '') : null
    })
  }));

  // If no createdDate, we can't draw the timeline reliably
  if (!ticket?.createdDate) return null;

  const created = new Date(ticket.createdDate);
  // Use the editable date for drawing if available, otherwise the original
  const currentTargetStr = isEditMode ? targetDateStr : ticket?.targetDate;
  
  // If we don't have a target date and not in edit mode, hide
  if (!currentTargetStr && !isEditMode) return null;

  const target = currentTargetStr ? new Date(currentTargetStr) : new Date();
  const now = new Date();

  // If target date is before created date, the timeline math breaks.
  const total = target.getTime() - created.getTime();
  const elapsed = now.getTime() - created.getTime();
  
  let percentage = 0;
  if (total > 0) {
    percentage = Math.max(0, Math.min(100, (elapsed / total) * 100));
  } else {
    percentage = 100;
  }

  const isOverdue = now > target;

  const formatDate = (d) => {
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Paper elevation={1} sx={{ borderRadius: '3px', p: 2.5, mb: 1.5, overflow: 'hidden' }}>      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'center' }}>
        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: theme.palette.text.secondary }}>
          Created: {formatDate(created)}
        </Typography>
        
        {isEditMode ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: theme.palette.text.secondary }}>Target:</Typography>
            <TextField
              type="datetime-local"
              size="small"
              value={targetDateStr}
              onChange={(e) => setTargetDateStr(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '12px', height: '30px' } }}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        ) : (
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: isOverdue ? theme.palette.error.main : theme.palette.text.secondary }}>
            Target: {currentTargetStr ? formatDate(target) : 'Not set'}
          </Typography>
        )}
      </Box>

      {currentTargetStr && total > 0 && (
        <>
          <Box sx={{ position: 'relative', width: '100%', my: 1.5 }}>
            <LinearProgress 
              variant="determinate" 
              value={percentage} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: `${theme.palette.primary.main}20`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: theme.palette.primary.main
                }
              }} 
            />
            
            <Box 
              sx={{ 
                position: 'absolute', 
                top: '50%', 
                left: `${percentage}%`, 
                transform: 'translate(-50%, -50%)',
                width: 12, 
                height: 12, 
                borderRadius: '50%',
                backgroundColor: '#fff',
                border: `3px solid ${theme.palette.primary.main}`,
                boxShadow: '0 0 0 2px rgba(255,255,255,0.5)',
                zIndex: 1
              }} 
            />
          </Box>

          <Box sx={{ position: 'relative', height: '20px' }}>
            <Typography 
              sx={{ 
                fontSize: '12px', 
                fontWeight: 700,
                color: theme.palette.primary.main,
                position: 'absolute',
                left: `${percentage}%`,
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap'
              }}
            >
              Today ({formatDate(now)})
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
});

export default TicketProgress;
