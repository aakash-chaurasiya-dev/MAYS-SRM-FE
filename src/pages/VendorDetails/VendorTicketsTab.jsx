import React from 'react';
import { Box, Typography, Card, CircularProgress, Chip, Stack, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function VendorTicketsTab({ tickets = [], loading = false }) {
  const theme = useTheme();
  const navigate = useNavigate();

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" pt={4}><CircularProgress /></Box>;
  }

  if (tickets.length === 0) {
    return <Typography color="text.secondary" align="center" mt={4}>No tickets found for this vendor.</Typography>;
  }

  return (
    <Stack spacing={2}>
      {tickets.map(ticket => (
        <Card
          key={ticket.ticketId}
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            cursor: 'pointer',
            transition: 'box-shadow 0.2s, border-color 0.2s',
            '&:hover': {
              boxShadow: theme.shadows[3],
              borderColor: theme.palette.primary.main
            }
          }}
          onClick={() => navigate(`/tickets/${ticket.ticketId}`)}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
              {`TK-${ticket.ticketId}`} — <Chip
                label={ticket.ticketStatusName || 'OPEN'}
                size="small"
                sx={{
                  fontWeight: 'bold', fontSize: '0.7rem',
                  bgcolor: ticket.ticketStatusName === 'CLOSED' ? `${theme.palette.error.main}1A` : `${theme.palette.success.main}1A`,
                  color: ticket.ticketStatusName === 'CLOSED' ? 'error.main' : 'success.main'
                }} />
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
              {ticket.ticketDescription
                ? ticket.ticketDescription.substring(0, 45) + (ticket.ticketDescription.length > 45 ? '…' : '')
                : ticket.ticketTypeName || `Ticket #${ticket.ticketId}`}
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" >
            <strong>Customer:</strong> {[ticket.userFirstName, ticket.userLastName].filter(Boolean).join(' ') || 'N/A'} &nbsp;|&nbsp;
            <strong>Type:</strong> {ticket.ticketTypeName || ''}
          </Typography>
          <Box display="flex" flexDirection='row' justifyContent="space-between" mt={1}>
            <Box>
              <Typography variant="caption" color="text.disabled" display="block">Vendor User Name</Typography>
              <Typography variant="body2" fontWeight={500}>{ticket.vendorUserName}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.disabled" display="block">Created Date</Typography>
              <Typography variant="body2" fontWeight={500}>{formatDateTime(ticket.createdDate)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.disabled" display="block">Target Date</Typography>
              <Typography variant="body2" fontWeight={500}>{formatDateTime(ticket.targetDate)}</Typography>
            </Box>
          </Box>
        </Card>
      ))}
    </Stack>
  );
}
