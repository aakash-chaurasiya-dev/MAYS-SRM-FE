import React from 'react';
import { Box, Typography, Paper, TextField, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const FIELD_SX = { bgcolor: 'background.paper' };

export default function InvoiceSummary({ form, setField, totals }) {
  const theme = useTheme();
  const { subTotal, cgst, sgst, roundOff, grandTotal } = totals;
  const fmtINR = (n) => `₹ ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' }, gap: 2 }}>
      {/* Terms */}
      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '12px', p: 3 }}>
        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1 }}>
          Terms &amp; Conditions
        </Typography>
        <TextField multiline rows={6} fullWidth value={form.terms || ''} onChange={setField('terms')}
          size="small" InputProps={{ sx: FIELD_SX }} />
      </Paper>

      {/* Totals */}
      <Paper elevation={0} sx={{
        border: `1px solid ${theme.palette.divider}`, borderRadius: '12px', p: 3,
        bgcolor: '#dae2ff',
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[
            { label: 'Sub Total', value: fmtINR(subTotal) },
            { label: 'CGST (9%)', value: fmtINR(cgst) },
            { label: 'SGST (9%)', value: fmtINR(sgst) },
            { label: 'IGST (0%)', value: fmtINR(0) },
          ].map(({ label, value }) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <Typography sx={{ fontSize: '14px', color: '#001848' }}>{label}</Typography>
              <Typography sx={{ fontSize: '14px', fontFamily: 'monospace', color: '#001848' }}>{value}</Typography>
            </Box>
          ))}
          <Divider sx={{ my: 0.5, borderColor: '#b2c5ff' }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '14px', color: '#001848' }}>Round Off</Typography>
            <Typography sx={{ fontSize: '14px', fontFamily: 'monospace', color: '#001848' }}>
              - {fmtINR(roundOff)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#001848' }}>Grand Total</Typography>
            <Typography sx={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: '#001848' }}>
              {fmtINR(grandTotal)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ mt: 2.5, p: 1.5, bgcolor: 'rgba(0,41,109,0.08)', borderRadius: 1, border: '1px solid rgba(0,41,109,0.15)' }}>
          <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.65, color: '#001848' }}>
            Amount in Words
          </Typography>
          <TextField variant="standard" fullWidth value={form.amountInWords || ''}
            onChange={setField('amountInWords')}
            placeholder="e.g. Six Thousand Only"
            InputProps={{ disableUnderline: true, sx: { fontSize: '14px', fontWeight: 700, color: '#001848' } }} />
        </Box>
      </Paper>
    </Box>
  );
}
