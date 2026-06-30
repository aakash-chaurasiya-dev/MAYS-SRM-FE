import React from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import SectionCard from './SectionCard';

const FIELD_SX = { bgcolor: 'background.paper' };

export default function TicketInformation({ form, setField, inputProps }) {
  return (
    <SectionCard icon={<ConfirmationNumberOutlinedIcon />} title="Ticket Information">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
        <TextField label="Ticket ID" placeholder="Search Ticket ID…" {...inputProps('ticketId')} />
        <FormControl size="small" fullWidth>
          <InputLabel>Service Type</InputLabel>
          <Select label="Service Type" value={form.serviceType || ''} onChange={setField('serviceType')} sx={FIELD_SX}>
            <MenuItem value="Hardware Repair">Hardware Repair</MenuItem>
            <MenuItem value="Annual Maintenance">Annual Maintenance</MenuItem>
            <MenuItem value="Software Installation">Software Installation</MenuItem>
          </Select>
        </FormControl>
        <TextField label="Device Name" {...inputProps('deviceName')} />
        <TextField label="Customer Name" {...inputProps('customerName', true)} />
        <TextField label="Contact Number" {...inputProps('contactNumber', true)} />
      </Box>
    </SectionCard>
  );
}
