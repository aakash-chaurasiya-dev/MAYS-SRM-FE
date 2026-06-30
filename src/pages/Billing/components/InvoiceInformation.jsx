import React from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import ReceiptOutlinedIcon from '@mui/icons-material/ReceiptOutlined';
import SectionCard from './SectionCard';

const FIELD_SX = { bgcolor: 'background.paper' };

export default function InvoiceInformation({ form, setField, inputProps }) {
  return (
    <SectionCard icon={<ReceiptOutlinedIcon />} title="Invoice Information">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <TextField label="Invoice Number" {...inputProps('invoiceNo')}
            inputProps={{ style: { fontFamily: 'monospace' } }} />
          <TextField type="date" {...inputProps('invoiceDate')}
            InputLabelProps={{ shrink: true }} />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <TextField label="Delivery Note" {...inputProps('deliveryNote')} />
          <TextField label="Supplier Ref" {...inputProps('supplierRef')} />
        </Box>
        <FormControl size="small" fullWidth>
          <InputLabel>Payment Terms</InputLabel>
          <Select label="Payment Terms" value={form.paymentTerms || ''} onChange={setField('paymentTerms')} sx={FIELD_SX}>
            <MenuItem value="Immediate">Immediate</MenuItem>
            <MenuItem value="Net 15 Days">Net 15 Days</MenuItem>
            <MenuItem value="Net 30 Days">Net 30 Days</MenuItem>
            <MenuItem value="Advance Payment">Advance Payment</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </SectionCard>
  );
}
