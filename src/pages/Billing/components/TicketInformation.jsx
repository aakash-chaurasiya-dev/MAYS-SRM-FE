import React from 'react';
import { Box, TextField} from '@mui/material';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import SectionCard from './SectionCard';

export default function TicketInformation({inputProps }) {
  return (
    <SectionCard icon={<ConfirmationNumberOutlinedIcon />} title="Ticket Information">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
        <TextField label="Ticket ID" {...inputProps('ticketId', true)} />
        <TextField label="Device Name" {...inputProps('deviceName', true)} />
        <TextField label="Customer Name" {...inputProps('customerName', true)} />
        <TextField label="Contact Number" {...inputProps('contactNumber', true)} />
      </Box>
    </SectionCard>
  );
}
