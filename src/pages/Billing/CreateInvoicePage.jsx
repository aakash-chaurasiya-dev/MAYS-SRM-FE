import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import { Box, Typography, Button } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useTheme } from '@mui/material/styles';

import TicketInformation from './components/TicketInformation';
import BillingDetails from './components/BillingDetails';
import InvoiceInformation from './components/InvoiceInformation';
import ChargeDetails from './components/ChargeDetails';
import InvoiceSummary from './components/InvoiceSummary';
import InvoicePreview from './components/InvoicePreview';

const defaultLineItem = () => ({
  id: crypto.randomUUID(),
  chargeTypeId: '',
  productId: '',
  serviceChargeId: '',
  statusId: '',
  amount: 0,
});

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

const FIELD_SX = { bgcolor: 'background.paper' };
const READONLY_SX = { bgcolor: 'action.hover', '& fieldset': { borderColor: 'divider' } };

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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [form, setForm] = useState({});

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
      }).catch(console.error);
    }
  }, [ticketId]);

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
    const isProduct = name.includes('product');
    const isService = name.includes('service');
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
        <TicketInformation form={form} setField={setField} inputProps={inputProps} />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
          <BillingDetails inputProps={inputProps} />
          <InvoiceInformation form={form} setField={setField} inputProps={inputProps} />
        </Box>

        <ChargeDetails 
          items={items} 
          chargeTypes={chargeTypes} 
          products={products} 
          services={services} 
          statuses={statuses}
          addItem={addItem}
          removeItem={removeItem}
          updateItem={updateItem}
          updateChargeType={updateChargeType}
          handleProductChange={handleProductChange}
          handleServiceChange={handleServiceChange}
          getChargeTypeInfo={getChargeTypeInfo}
        />

        <InvoiceSummary 
          form={form} 
          setField={setField} 
          totals={totals}
        />
      </Box>

      {/* ── Preview Drawer ── */}
      <InvoicePreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        form={form}
        items={items.map(item => {
          let description = '—';
          if (item.productName) {
            description = item.productName;
          } else if (item.productId) {
            const p = products.find(prod => prod.productId === item.productId);
            if (p) description = p.productName;
          } else if (item.serviceChargeDescription) {
            description = item.serviceChargeDescription;
          } else if (item.serviceChargeId) {
            const s = services.find(serv => serv.chargeId === item.serviceChargeId);
            if (s) description = s.descr;
          } else if (item.chargeTypeName) {
            description = item.chargeTypeName;
          } else if (item.chargeTypeId) {
            const ct = chargeTypes.find(c => c.chargeTypeId === item.chargeTypeId);
            if (ct) description = ct.chargeName;
          }

          let hsn = '—';
          if (item.productId || (item.chargeTypeName && item.chargeTypeName.toLowerCase().includes('product'))) {
            hsn = '8471';
          } else if (item.serviceChargeId || (item.chargeTypeName && item.chargeTypeName.toLowerCase().includes('service'))) {
            hsn = '9987';
          }

          return {
            id: item.id || item.billingId,
            description: description,
            hsn: hsn,
            qty: 1,
            rate: Number(item.amount) || 0,
            disc: 0
          };
        })}
        totals={totals}
      />
    </Box>
  );
}
