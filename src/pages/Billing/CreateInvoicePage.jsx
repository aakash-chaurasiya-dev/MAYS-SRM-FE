import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import {
  Box, Paper, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, IconButton, Dialog, DialogContent, Chip, Divider,
} from '@mui/material';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import ReceiptOutlinedIcon from '@mui/icons-material/ReceiptOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { useTheme } from '@mui/material/styles';

const FIELD_SX = { bgcolor: 'background.paper' };
const READONLY_SX = { bgcolor: 'action.hover', '& fieldset': { borderColor: 'divider' } };

const defaultLineItem = () => ({
  id: crypto.randomUUID(),
  chargeTypeId: '',
  productId: '',
  serviceChargeId: '',
  statusId: '',
  amount: 0,
});

/* ── Section Card wrapper ── */
function SectionCard({ icon, title, children, sx }) {
  const theme = useTheme();
  return (
    <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '12px', p: 3, ...sx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, color: 'primary.main' }}>
        {icon}
        <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</Typography>
      </Box>
      {children}
    </Paper>
  );
}

/* ── Invoice Preview — centered Dialog modal ── */
function InvoicePreview({ open, onClose, form, items, totals }) {
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
        <Box sx={{
          width: '210mm', minHeight: '297mm', bgcolor: '#fff', mx: 'auto',
          p: '16mm', boxShadow: 6,
          display: 'flex', flexDirection: 'column', gap: 4, fontSize: '13px',
        }}>

          {/* ── Invoice header ── */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography sx={{ fontSize: '28px', fontWeight: 700, color: 'primary.main', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Workshop Pro
              </Typography>
              <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary' }}>
                Services Pvt Ltd
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

/* ── Number to Words Helper ── */
const numberToWords = (num) => {
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
  if ((num = num.toString()).length > 9) return 'Overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim() ? str.trim() + ' Only' : 'Zero';
};

/* ── Main Page ── */
export default function CreateInvoicePage() {
  const theme = useTheme();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const ticketId = searchParams.get('ticketId');

  const [chargeTypes, setChargeTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get('/charge-types').then(res => setChargeTypes(res.data?.data || res.data || []));
    api.get('/inventory').then(res => setProducts(res.data?.data || res.data || []));
    api.get('/service-charges').then(res => setServices(res.data?.data || res.data || []));
    api.get('/statuses/type/Billing').then(res => {
      const allStatus = res.data?.data || res.data || [];
      setStatuses(allStatus);
    });

    if (ticketId) {
      api.get(`/tickets/${ticketId}`).then(res => {
         const t = res.data?.data || res.data;
         if (t) {
           setForm(f => ({ ...f, ticketId: t.ticketId, customerName: (t.userFirstName || '') + ' ' + (t.userLastName || ''), contactNumber: t.userMobileNo || '', deviceName: t.deviceModelName || '' }));
         }
      }).catch(console.error);
      
      api.get(`/billing/ticket/${ticketId}`).then(res => {
         const charges = res.data?.data || res.data || [];
         setItems(charges.map(i => ({ ...i, id: i.billingId || crypto.randomUUID() })));
         console.log("charges",res);
      }).catch(console.error);
    }
  }, [ticketId]);



  const [previewOpen, setPreviewOpen] = useState(false);
  const [form, setForm] = useState({});

  const setField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const updateItem = useCallback((id, key, value) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [key]: value } : item));
  }, []);

  const addItem = () => {
    const pendingStatus = statuses.find(s => s.statusName?.toLowerCase() === 'pending');
    setItems(prev => [...prev, { ...defaultLineItem(), statusId: pendingStatus ? pendingStatus.statusId : '' }]);
  };
  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const handleProductChange = (id, productId) => {
    const product = products.find(p => p.productId === productId);
    setItems(prev => prev.map(item => item.id === id ? { ...item, productId, amount: product ? product.sellingPrice : item.amount } : item));
  };

  const handleServiceChange = (id, serviceChargeId) => {
    const service = services.find(s => s.chargeId === serviceChargeId);
    setItems(prev => prev.map(item => item.id === id ? { ...item, serviceChargeId, amount: service ? service.amount : item.amount } : item));
  };
 
  const getChargeTypeInfo = (chargeTypeId) => {
    const ct = chargeTypes.find(c => c.chargeTypeId === chargeTypeId);
    if (!ct) return { isProduct: false, isService: false };
    const name = (ct.chargeName || '').toLowerCase();
    const isProduct = name.includes('product') ;
    const isService = name.includes('service') ;
    return { isProduct, isService };
  };

  const updateChargeType = (id, newTypeId) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, chargeTypeId: newTypeId, productId: '', serviceChargeId: '' };
      }
      return item;
    }));
  };

  const handleUpdate = async () => {
    if (!ticketId) return alert('No Ticket ID found!');
    try {
      const payload = items.map(i => ({
        billingId: i.billingId,
        chargeTypeId: i.chargeTypeId || null,
        productId: i.productId || null,
        serviceChargeId: i.serviceChargeId || null,
        statusId: i.statusId || null,
        amount: i.amount || 0,
      }));
      await api.put(`/billing/ticket/${ticketId}/charges`, payload);
      alert('Charges updated successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to update charges');
    }
  };

  // Compute totals
  const subTotal = items.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const cgst = 0;
  const sgst = 0;
  const grandRaw = subTotal + cgst + sgst;
  const grandTotal = Math.round(grandRaw);
  const roundOff = Number((grandRaw - grandTotal).toFixed(2));
  const totals = { subTotal, cgst, sgst, grandTotal, roundOff };
  const fmtINR = (n) => `₹ ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  useEffect(() => {
    setForm(f => ({ ...f, amountInWords: numberToWords(grandTotal) }));
  }, [grandTotal]);

  const inputProps = (key, readOnly = false) => ({
    size: 'small',
    fullWidth: true,
    value: form[key] || '',
    onChange: readOnly ? undefined : setField(key),
    InputProps: { readOnly, sx: readOnly ? READONLY_SX : FIELD_SX },
  });

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
            Generate GST Invoice
          </Typography>
          <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
            Create and generate professional GST tax invoices.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" color="primary" size="small" onClick={handleUpdate}>Update</Button>
          <Button variant="contained" color="inherit"
            sx={{ bgcolor: '#003d9b', color: '#91afff', '&:hover': { bgcolor: '#002d8a' } }}
            size="small" startIcon={<VisibilityOutlinedIcon />}
            onClick={() => setPreviewOpen(true)}>
            Preview Invoice
          </Button>
          <Button variant="contained" size="small">Generate Invoice</Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* ── Ticket Information ── */}
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

        {/* ── Billing Details + Invoice Info ── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
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
        </Box>

        {/* ── Charge Details ── */}
        <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '12px', overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2, bgcolor: theme.palette.action.hover, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em', color: 'primary.main' }}>
              Charge Details
            </Typography>
            <Button size="small" startIcon={<AddOutlinedIcon />} onClick={addItem}>Add Row</Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.background.default }}>
                  {['SR', 'Charge Type', 'Product', 'Service', 'Status', 'Amount (₹)'].map((h, i) => (
                    <TableCell key={h} align={i === 5 ? 'right' : 'left'}
                      sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', py: 1.5, whiteSpace: 'nowrap' }}>
                      {h}
                    </TableCell>
                  ))}
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, idx) => {
                  return (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', width: 40, color: 'text.secondary' }}>{String(idx + 1).padStart(2, '0')}</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>
                        <Select variant="standard" fullWidth value={item.chargeTypeId || ''} size="small" disableUnderline
                          onChange={(e) => updateChargeType(item.id, e.target.value)}>
                          {chargeTypes.map(ct => <MenuItem key={ct.chargeTypeId} value={ct.chargeTypeId}>{ct.chargeName}</MenuItem>)}
                        </Select>
                      </TableCell>
                      <TableCell sx={{ minWidth: 150 }}>
                        <Select variant="standard" fullWidth value={item.productId || ''} size="small" disableUnderline
                          disabled={!getChargeTypeInfo(item.chargeTypeId).isProduct}
                          onChange={(e) => handleProductChange(item.id, e.target.value)}>
                          <MenuItem value=""><em>None</em></MenuItem>
                          {products.map(p => <MenuItem key={p.productId} value={p.productId}>{p.productName}</MenuItem>)}
                        </Select>
                      </TableCell>
                      <TableCell sx={{ minWidth: 150 }}>
                        <Select variant="standard" fullWidth value={item.serviceChargeId || ''} size="small" disableUnderline
                          disabled={!getChargeTypeInfo(item.chargeTypeId).isService}
                          onChange={(e) => handleServiceChange(item.id, e.target.value)}>
                          <MenuItem value=""><em>None</em></MenuItem>
                          {services.map(s => <MenuItem key={s.chargeId} value={s.chargeId}>{s.descr}</MenuItem>)}
                        </Select>
                      </TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        <Select variant="standard" fullWidth value={item.statusId || ''} size="small" disableUnderline
                          onChange={(e) => updateItem(item.id, 'statusId', e.target.value)}>
                          <MenuItem value=""><em>None</em></MenuItem>
                          {statuses.map(s => <MenuItem key={s.statusId} value={s.statusId}>{s.statusName}</MenuItem>)}
                        </Select>
                      </TableCell>
                      <TableCell align="right" sx={{ width: 110 }}>
                        <TextField variant="standard" type="number" value={item.amount} size="small"
                          onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                          InputProps={{ disableUnderline: true, inputProps: { style: { textAlign: 'right' } } }} sx={{ width: 100 }} />
                      </TableCell>
                      <TableCell sx={{ width: 40 }}>
                        <IconButton size="small" onClick={() => removeItem(item.id)}
                          sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* ── Summary Section ── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' }, gap: 2 }}>
          {/* Terms */}
          <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '12px', p: 3 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1 }}>
              Terms &amp; Conditions
            </Typography>
            <TextField multiline rows={6} fullWidth value={form.terms} onChange={setField('terms')}
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
              <TextField variant="standard" fullWidth value={form.amountInWords}
                onChange={setField('amountInWords')}
                placeholder="e.g. Six Thousand Only"
                InputProps={{ disableUnderline: true, sx: { fontSize: '14px', fontWeight: 700, color: '#001848' } }} />
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* ── Preview Drawer ── */}
      <InvoicePreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        form={form}
        items={items}
        totals={totals}
      />
    </Box>
  );
}
