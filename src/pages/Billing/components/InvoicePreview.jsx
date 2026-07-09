import React from 'react';
import { Box, Typography, Button, IconButton, Dialog, DialogContent, Chip, Divider, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';

/* ── Invoice Preview — centered Dialog modal ── */
export default function InvoicePreview({ open, onClose, form, items, totals }) {
  const fmtINR = (n) => `₹ ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '90vw', maxWidth: 1000, height: '90vh',
          borderRadius: '12px', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        },
      }}
      BackdropProps={{ sx: { backdropFilter: 'blur(8px)', bgcolor: 'rgba(26,27,33,0.45)' } }}
    >
      {/* ── Modal header ── */}
      <Box sx={{
        px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        bgcolor: 'background.default', flexShrink: 0,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontSize: '20px', fontWeight: 600, color: 'primary.main' }}>Invoice Preview</Typography>
          <Chip label="DRAFT" size="small" color="success" sx={{ fontWeight: 700, fontSize: '10px', letterSpacing: '0.05em' }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button variant="outlined" size="small" startIcon={<PrintOutlinedIcon />} onClick={() => window.print()}>
            Print Invoice
          </Button>
          <Button variant="contained" size="small" startIcon={<DownloadOutlinedIcon />}
            sx={{ bgcolor: '#003d9b', '&:hover': { bgcolor: '#002d8a' } }}
            onClick={() => window.print()}>
            Download PDF
          </Button>
          <IconButton size="small" onClick={onClose}
            sx={{ ml: 1, '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' } }}>
            <CloseOutlinedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* ── Scrollable invoice canvas ── */}
      <DialogContent sx={{ bgcolor: '#d9d9e2', p: 5, overflowY: 'auto', flex: 1 }}>
        <Box id="printable-invoice" sx={{
          width: '210mm', minHeight: '297mm', bgcolor: '#fff', mx: 'auto',
          p: '16mm', boxShadow: 6,
          display: 'flex', flexDirection: 'column', gap: 4, fontSize: '13px',
        }}>

          {/* ── Invoice header ── */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography sx={{ fontSize: '28px', fontWeight: 700, color: 'primary.main', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Mays Computers
              </Typography>
              <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary' }}>
                Complete IT Solutions
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                402, Tech Square, Phase 7<br />
                Industrial Area, Mohali, PB 160062<br />
                <strong>GSTIN: 03AABCW0001Z1Z0</strong>
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.5 }}>
              <Typography sx={{ fontSize: '22px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'text.disabled', opacity: 0.25 }}>
                Tax Invoice
              </Typography>
              <Box sx={{ bgcolor: '#f3f3fb', border: '1px solid', borderColor: 'divider', borderRadius: '8px', p: 2, minWidth: 200 }}>
                {[
                  ['Invoice No:', form.invoiceNo || 'WP-2024-XXXX'],
                  ['Date:', form.invoiceDate || '—'],
                  ...(form.ticketId ? [['Ticket ID:', form.ticketId]] : []),
                ].map(([label, val]) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, mb: 0.3 }}>
                    <Typography sx={{ fontSize: '12px', color: 'text.secondary' }}>{label}</Typography>
                    <Typography sx={{ fontSize: '12px', fontWeight: 700 }}>{val}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          {/* ── Billing details ── */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', py: 3 }}>
            <Box>
              <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', mb: 1.5 }}>Bill To:</Typography>
              <Typography sx={{ fontSize: '16px', fontWeight: 700, mb: 0.5 }}>{form.customerName || '—'}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {form.billingAddress || '—'}
              </Typography>
              {form.gstin && <Typography variant="body2" sx={{ mt: 1 }}><strong>GSTIN:</strong> {form.gstin}</Typography>}
              {form.stateCode && <Typography variant="body2"><strong>State:</strong> {form.stateCode}</Typography>}
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', mb: 1.5 }}>Shipping Address:</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>Same as Billing Address</Typography>
              {form.deviceName && <Typography variant="body2" sx={{ mt: 2 }}><strong>Device:</strong> {form.deviceName}</Typography>}
              {form.serviceType && <Typography variant="body2"><strong>Service:</strong> {form.serviceType}</Typography>}
            </Box>
          </Box>

          {/* ── Line items table ── */}
          <Table size="small" sx={{ '& thead tr': { borderBottom: '2px solid', borderColor: 'primary.main' } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f3f3fb' }}>
                {['#', 'Description', 'HSN', 'Qty', 'Rate', 'Amount'].map((h, i) => (
                  <TableCell key={h} align={i >= 3 ? 'right' : 'left'}
                    sx={{ fontSize: '12px', fontWeight: 700, color: 'text.secondary', py: 1.5 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody sx={{ '& tr': { borderBottom: '1px solid', borderColor: 'divider' } }}>
              {items.map((item, i) => (
                <TableRow key={item.id}>
                  <TableCell sx={{ width: 32 }}>{String(i + 1).padStart(2, '0')}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700 }}>{item.description || '—'}</Typography>
                    {item.disc > 0 && (
                      <Typography sx={{ fontSize: '11px', color: '#802a03', mt: 0.3 }}>Discount Applied: {item.disc}%</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '12px' }}>{item.hsn}</TableCell>
                  <TableCell align="right">{item.qty}</TableCell>
                  <TableCell align="right">{Number(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {(Number(item.qty) * Number(item.rate) * (1 - Number(item.disc) / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* ── Totals & GST summary ── */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
            {/* Left: GST breakdown + bank details */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ bgcolor: '#f3f3fb', border: '1px solid', borderColor: 'divider', borderRadius: '8px', p: 2 }}>
                <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', mb: 1.5 }}>
                  GST Breakdown (18%)
                </Typography>
                {[
                  { label: 'CGST (9%)', value: fmtINR(totals.cgst) },
                  { label: 'SGST (9%)', value: fmtINR(totals.sgst) },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '12px', color: 'text.secondary' }}>{label}</Typography>
                    <Typography sx={{ fontSize: '12px', color: 'text.secondary' }}>{value}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, color: 'primary.main' }}>Total GST</Typography>
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, color: 'primary.main' }}>{fmtINR(totals.cgst + totals.sgst)}</Typography>
                </Box>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 700, mb: 0.5 }}>Payment Information:</Typography>
                {[
                  ['Bank:', 'HDFC Bank Ltd'],
                  ['A/C Name:', 'Workshop Pro Services'],
                  ['A/C No:', '50200048123992'],
                  ['IFSC:', 'HDFC0000124'],
                ].map(([label, val]) => (
                  <Typography key={label} sx={{ fontSize: '12px', color: 'text.secondary' }}>
                    {label} {val}
                  </Typography>
                ))}
              </Box>
            </Box>

            {/* Right: dark blue totals card */}
            <Box sx={{
              width: 240, bgcolor: 'primary.main', color: '#fff',
              borderRadius: '8px', p: 3, boxShadow: 3, alignSelf: 'flex-start',
              display: 'flex', flexDirection: 'column', gap: 1.5,
            }}>
              {[
                { label: 'Sub Total', value: fmtINR(totals.subTotal) },
                { label: 'Tax Total', value: fmtINR(totals.cgst + totals.sgst) },
                { label: 'Round Off', value: fmtINR(totals.roundOff) },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', pb: 1.5, borderBottom: '1px solid rgba(255,255,255,0.2)', opacity: 0.85 }}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 700 }}>{label}</Typography>
                  <Typography sx={{ fontSize: '13px' }}>{value}</Typography>
                </Box>
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 0.5 }}>
                <Typography sx={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Grand Total</Typography>
                <Typography sx={{ fontSize: '22px', fontWeight: 700, lineHeight: 1.1 }}>{fmtINR(totals.grandTotal)}</Typography>
              </Box>
            </Box>
          </Box>

          {/* ── Footer: Terms + Signatures ── */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, borderTop: '1px solid', borderColor: 'divider', pt: 3, mt: 'auto' }}>
            <Box>
              <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', mb: 1 }}>
                Terms &amp; Conditions:
              </Typography>
              <Typography component="ol" sx={{ fontSize: '12px', color: 'text.secondary', lineHeight: 1.8, pl: 2, m: 0 }}>
                <li>Payment due within 15 days of invoice date.</li>
                <li>Interest at 18% p.a. will be charged for delayed payments.</li>
                <li>All disputes are subject to Mumbai Jurisdiction.</li>
              </Typography>
              {/* Customer signature */}
              <Box sx={{ mt: 5 }}>
                <Box sx={{ width: 160, height: 40, mb: 1 }} />
                <Typography sx={{ fontSize: '12px', fontWeight: 700, borderTop: '1px solid', borderColor: 'text.secondary', pt: 1, color: 'text.secondary', width: 160, textAlign: 'center' }}>
                  Customer Signature
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
              <Box sx={{ textAlign: 'right' }}>
                <Box sx={{ width: 160, height: 40, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', opacity: 0.4 }}>
                  <Typography sx={{ fontSize: '13px', fontStyle: 'italic', color: 'text.secondary' }}>~ signature ~</Typography>
                </Box>
                <Typography sx={{ fontSize: '12px', fontWeight: 700, borderTop: '1px solid', borderColor: 'text.secondary', pt: 1, color: 'text.secondary', width: 160, textAlign: 'center' }}>
                  Authorized Signatory
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* ── Computer generated note ── */}
          <Typography sx={{ textAlign: 'center', fontSize: '11px', color: 'text.disabled', fontStyle: 'italic', mt: 1 }}>
            This is a computer-generated invoice and does not require a physical signature.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
