import React from 'react';
import { Box, TextField } from '@mui/material';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import SectionCard from './SectionCard';

export default function BillingDetails({ inputProps }) {
  return (
    <SectionCard icon={<PersonOutlinedIcon />} title="Billing Details">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField label="Customer Name" {...inputProps('customerName')} />
        <TextField label="Billing Address" multiline rows={3} {...inputProps('billingAddress')} />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <TextField label="GSTIN" placeholder="27AAAAA0000A1Z5" {...inputProps('gstin')} />
          <TextField label="State Code" {...inputProps('stateCode')} />
        </Box>
      </Box>
    </SectionCard>
  );
}
