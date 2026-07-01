import React from 'react';
import { Box, Typography, Chip, IconButton, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useTheme } from '@mui/material/styles';

/**
 * TicketHeader
 * 
 * Displays the top section of the ticket detail page, including the back button, 
 * ticket title, status chips, and global action buttons (Edit/Save, Billing).
 */
export default function TicketHeader({
  ticket,
  loading,
  error,
  isNormalUser,
  isEditMode,
  onNavigateBack,
  onNavigateBilling,
  onEditClick,
  onCancelEdit,
  onSaveClick,
  saving
}) {
  const theme = useTheme();

  // Handle derived values safely
  const ticketCode = ticket?.ticketId ? `TK-${ticket.ticketId}` : 'Not available';
  const deviceName = ticket?.deviceModelName || 'Not available';
  const ticketTitle = deviceName !== 'Not available' ? `${deviceName}` : 'Ticket details';

  const statusDisplay = ticket?.ticketStatusName || ticket?.status || 'Open';
  
  // Determine color for the status chip
  let statusChipColor = 'default';
  if (['CLOSED', 'RESOLVED'].includes(statusDisplay.toUpperCase())) statusChipColor = 'success';
  else if (statusDisplay.toUpperCase() === 'IN PROGRESS') statusChipColor = 'info';
  else if (statusDisplay.toUpperCase() === 'OPEN') statusChipColor = 'warning';
  else if (statusDisplay.toUpperCase() === 'CRITICAL') statusChipColor = 'error';

  return (
    <Box>
      {/* Top Breadcrumb / Location Header */}
      {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <IconButton size="small" onClick={onNavigateBack} sx={{ color: theme.palette.text.secondary }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography sx={{ fontSize: '11px', fontWeight: 600, color: theme.palette.text.secondary, letterSpacing: '0.04em' }}>
          Back
        </Typography>
      </Box> */}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 1.5 }}>
        {/* Title & Status Chips */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
            {loading ? 'Loading ticket details…' : ticketTitle}
          </Typography>
          <Chip
            label={ticketCode}
            size="small"
            sx={{ fontWeight: 600, borderRadius: '2px', bgcolor: `${theme.palette.primary.main}14`, color: theme.palette.primary.main, height: 22 }}
          />
          <Chip
            label={statusDisplay.toUpperCase()}
            size="small"
            color={statusChipColor}
            sx={{ fontWeight: 600, borderRadius: '2px', height: 22 }}
          />
        </Box>

        {/* Action Buttons (Staff Only) */}
        {!isNormalUser && (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button variant="outlined" color="primary" size="small" sx={{ fontSize: '12px' }} onClick={onNavigateBilling}>
              Billing Details
            </Button>
            {!isEditMode ? (
              <Button variant="outlined" size="small" startIcon={<EditOutlinedIcon />} sx={{ fontSize: '12px' }} onClick={onEditClick}>
                Edit
              </Button>
            ) : (
              <>
                <Button variant="text" size="small" sx={{ fontSize: '12px' }} onClick={onCancelEdit} disabled={saving}>
                  Cancel
                </Button>
                <Button variant="contained" size="small" startIcon={<SaveOutlinedIcon />} sx={{ fontSize: '12px' }} onClick={onSaveClick} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </Box>
        )}
      </Box>

      {/* Error Messaging */}
      {error && (
        <Typography sx={{ fontSize: '13px', color: 'error.main', mb: 2 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
