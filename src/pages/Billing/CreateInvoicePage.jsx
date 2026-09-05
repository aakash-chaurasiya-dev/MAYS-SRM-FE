import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Box, Typography, Button } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { hasAnyRole } from '../../access/featureAccess';
import TicketInformation from './components/TicketInformation';
import BillingDetails from './components/BillingDetails';
import ChargeDetails from './components/ChargeDetails';
import InvoiceSummary from './components/InvoiceSummary';
import InvoicePreview from './components/InvoicePreview';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
const defaultLineItem = () => ({
  id: crypto.randomUUID(),
  chargeTypeId: '',
  productId: '',
  serviceChargeId: '',
  statusId: '',
  amount: 0,
});

const numberToWords = (num) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if ((num = num.toString()).length > 9) return 'Overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += n[1] != 0 ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += n[2] != 0 ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += n[3] != 0 ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += n[4] != 0 ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += n[5] != 0 ? (str != '' ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim() ? str.trim() + ' Only' : 'Zero';
};

const FIELD_SX = { bgcolor: 'background.paper' };
const READONLY_SX = {
  bgcolor: 'action.hover',
  '& fieldset': { borderColor: 'divider' },
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
export default function CreateInvoicePage() {
  const theme = useTheme();
  const auth = useAuth();
  const location = useLocation();
  const ticketId = new URLSearchParams(location.search).get('ticketId');

  const [form, setForm] = useState({});
  const [items, setItems] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const staleTime = 1000 * 60 * 60;

  // ---- Reference data ----
  const { data: chargeTypes = [] } = useQuery({
    queryKey: ['chargeTypes'],
    queryFn: async () => {
      const res = await api.get('/charge-types');
      const data = res.data?.data || res.data || [];
      return data.map((ct, idx) => ({ ...ct, id: ct.chargeTypeId || `fallback-ct-${idx}` }));
    },
    staleTime,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: async () => {
      const res = await api.get('/inventory/products', { params: { limit: 200 } });
      const data = res.data?.data || res.data || [];
      return data.map((p, idx) => ({
        ...p,
        productId: p.partCatId || p.productId,
        productName: p.partName || p.productName,
        id: p.partCatId || p.productId || `fallback-prod-${idx}`,
      }));
    },
    staleTime,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['serviceCharges'],
    queryFn: async () => {
      const res = await api.get('/service-charges');
      const data = res.data?.data || res.data || [];
      return data.map((s, idx) => ({ ...s, id: s.chargeId || `fallback-serv-${idx}` }));
    },
    staleTime,
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ['statuses'],
    queryFn: async () => {
      const res = await api.get('/statuses');
      const allStatus = res.data?.data || res.data || [];
      return allStatus.map((s, idx) => ({ ...s, id: s.statusId || `fallback-status-${idx}` }));
    },
    select: (data) => data.filter((s) => s.statusType === 'Billing' || s.statusType === 'BILLING'),
    staleTime,
  });

  const { data: paymentModes = [] } = useQuery({
    queryKey: ['paymentModes'],
    queryFn: async () => {
      const res = await api.get('/payment-modes');
      const data = res.data?.data || res.data || [];
      return data.map((pm, idx) => ({ ...pm, id: pm.payModeId || `fallback-pm-${idx}` }));
    },
    staleTime,
  });

  // ---- Ticket data ----
  const { data: ticketData } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const res = await api.get(`/tickets/${ticketId}`);
      return res.data?.data || res.data;
    },
    enabled: !!ticketId,
    staleTime,
  });

  useEffect(() => {
    if (ticketData) {
      setForm((f) => ({
        ...f,
        ticketId: ticketData.ticketId,
        customerName: (ticketData.userFirstName || '') + ' ' + (ticketData.userLastName || ''),
        contactNumber: ticketData.userMobileNo || '',
        deviceName: ticketData.deviceModelName || '',
      }));
    }
  }, [ticketData]);

  // ---- Existing billing charges ----
  const { data: billingTicketCharges } = useQuery({
    queryKey: ['billingTicketCharges', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const res = await api.get(`/billing/ticket/${ticketId}`);
      return res.data?.data || res.data || [];
    },
    enabled: !!ticketId,
    staleTime,
  });

  useEffect(() => {
    if (billingTicketCharges) {
      setItems(
        billingTicketCharges.map((i) => ({
          ...i,
          id: i.billingId || crypto.randomUUID(),
          originalStatusId: i.statusId,
        }))
      );
    }
  }, [billingTicketCharges]);

  // ---- Form handlers ----
  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const updateItemBatch = useCallback((id, updatedFields) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item)));
  }, []);

  const getNewItemTemplate = () => {
    const pendingStatus = statuses.find((s) => s.statusName?.toLowerCase() === 'pending');
    return { ...defaultLineItem(), statusId: pendingStatus ? pendingStatus.statusId : '' };
  };

  const addNewItem = (newItem) => setItems((prev) => [...prev, newItem]);
  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const getChargeTypeInfo = (chargeTypeId) => {
    const ct = chargeTypes.find((c) => c.chargeTypeId === chargeTypeId);
    if (!ct) return { isProduct: false, isService: false };
    const name = (ct.chargeName || '').toLowerCase();
    return { isProduct: name.includes('product'), isService: name.includes('service') };
  };

  const canUserSeeChargeType = (chargeType) => {
    if (!chargeType) return false;
    if (!chargeType.allowedRoles?.trim()) return true;
    const allowedRoles = chargeType.allowedRoles.split(',').map((r) => r.trim()).filter(Boolean);
    return hasAnyRole(auth?.user, allowedRoles);
  };

  // ---- Filtered items ----
  const visibleItems = items.filter((item) => {
    const ct = chargeTypes.find((c) => c.chargeTypeId === item.chargeTypeId);
    if (!canUserSeeChargeType(ct)) return false;
    if (!showFullDetails) return ct?.accountingSide === 'R';
    return true;
  });

  // FIX: Show item unless customerVisibility is explicitly false
  const customerVisibleItems = items.filter((item) => {
    const ct = chargeTypes.find((c) => c.chargeTypeId === item.chargeTypeId);
    return ct?.customerVisibility;
  });

  // ---- Update charges ----
  const handleUpdate = async () => {
    if (!ticketId) {
      window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'No Ticket ID found!', severity: 'error' } }));
      return;
    }
    try {
      const payload = items.map((i) => ({
        billingId: i.billingId,
        chargeTypeId: i.chargeTypeId || null,
        productId: i.productId || null,
        serviceChargeId: i.serviceChargeId || null,
        paymentModeId: i.paymentModeId || null,
        statusId: i.statusId || null,
        amount: Math.abs(Number(i.amount || 0)),
        utr:i.utr || null,
      }));
      await api.put(`/billing/ticket/${ticketId}/charges`, payload);
      window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Charges updated successfully!', severity: 'success' } }));
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Failed to update charges', severity: 'error' } }));
    }
  };

  // ---- Invoice calculations ----
  const subTotal = visibleItems.reduce((sum, item) => {
    const ct = chargeTypes.find((c) => c.chargeTypeId === item.chargeTypeId);
    const amount = Math.abs(Number(item.amount || 0));
    return ct?.accountingSide === 'P' ? sum - amount : sum + amount;
  }, 0);

  const cgst = 0 ;
  const sgst = 0;
  const grandRaw = subTotal + cgst + sgst;
  const grandTotal = Math.round(grandRaw);
  const roundOff = Number((grandRaw - grandTotal).toFixed(2));
  const totals = { subTotal, cgst, sgst, grandTotal, roundOff };

  useEffect(() => {
    setForm((f) => ({ ...f, amountInWords: numberToWords(grandTotal) }));
  }, [grandTotal]);

  // ---- Input props helper ----
  const inputProps = (key, readOnly = false) => ({
    size: 'small',
    fullWidth: true,
    value: form[key] || '',
    onChange: readOnly ? undefined : setField(key),
    InputProps: { readOnly, sx: readOnly ? READONLY_SX : FIELD_SX },
  });

  // ---- Render ----
  return (
    <Box>
      {/* Page Header */}
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
          <Button variant="outlined" color="primary" size="small" onClick={handleUpdate}>
            Update Charges
          </Button>
          <Button
            variant="contained"
            color="inherit"
            sx={{ bgcolor: '#003d9b', color: '#91afff', '&:hover': { bgcolor: '#002d8a' } }}
            size="small"
            startIcon={<VisibilityOutlinedIcon />}
            onClick={() => setPreviewOpen(true)}
          >
            Preview Invoice
          </Button>
        </Box>
      </Box>

      {/* Main Form Content */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TicketInformation inputProps={inputProps} />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
          <BillingDetails inputProps={inputProps} />
        </Box>
        <ChargeDetails
          items={items}
          chargeTypes={chargeTypes}
          products={products}
          services={services}
          statuses={statuses}
          paymentModes={paymentModes}
          getNewItemTemplate={getNewItemTemplate}
          addNewItem={addNewItem}
          removeItem={removeItem}
          updateItemBatch={updateItemBatch}
          getChargeTypeInfo={getChargeTypeInfo}
          showFullDetails={showFullDetails}
          onToggleFullDetails={() => setShowFullDetails((prev) => !prev)}
        />
        <InvoiceSummary form={form} setField={setField} totals={totals} />
      </Box>

      {/* Invoice Preview */}
      <InvoicePreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        form={form}
        items={customerVisibleItems.map((item) => {
          let description = '—';
          if (item.productName) description = item.productName;
          else if (item.productId) {
            const p = products.find((prod) => prod.productId === item.productId);
            if (p) description = p.productName;
          } else if (item.serviceChargeDescription) description = item.serviceChargeDescription;
          else if (item.serviceChargeId) {
            const s = services.find((serv) => serv.chargeId === item.serviceChargeId);
            if (s) description = s.descr;
          } else if (item.chargeTypeName) description = item.chargeTypeName;
          else if (item.chargeTypeId) {
            const ct = chargeTypes.find((c) => c.chargeTypeId === item.chargeTypeId);
            if (ct) description = ct.chargeName;
          }

          let hsn = '—';
          if (item.productId || (item.chargeTypeName && item.chargeTypeName.toLowerCase().includes('product'))) hsn = '8471';
          else if (item.serviceChargeId || (item.chargeTypeName && item.chargeTypeName.toLowerCase().includes('service'))) hsn = '9987';

          const ct = chargeTypes.find((c) => c.chargeTypeId === item.chargeTypeId);
          const isPayable = ct?.accountingSide === 'P';
          const displayAmount = isPayable ? -Math.abs(Number(item.amount || 0)) : Math.abs(Number(item.amount || 0));

          return {
            id: item.id || item.billingId,
            description,
            hsn,
            qty: 1,
            rate: displayAmount,
            disc: 0,
          };
        })}
      />
    </Box>
  );
}