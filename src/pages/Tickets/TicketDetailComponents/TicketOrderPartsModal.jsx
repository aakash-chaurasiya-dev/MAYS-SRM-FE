import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Box, Typography, CircularProgress, Stack, Divider, MenuItem, FormControlLabel,
  Checkbox, Paper, Chip, Autocomplete,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';

const SOURCES = [
  { value: 'MARKET', label: 'Market' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'STOCK', label: 'Stock' },
];

const mapLineFromApi = (line, defaults = {}) => ({
  individualPartId: line.individualPartId,
  partSrNo: line.partSrNo || '',
  barcode: line.barcode || '',
  source: line.source || 'MARKET',
  stockPickIndividualPartId: null,
  damagedFlag: !!line.damagedFlag,
  returnedFlag: !!line.returnedFlag,
  vendorDamageReturn: !!line.vendorDamageReturn,
  returnPartSrNo: line.returnPartSrNo || '',
  replacedId: line.replacedId || null,
  received: !!line.received,
  salesPrice: line.salesPrice ?? defaults.salesPrice ?? '',
  purchasePrice: line.purchasePrice ?? defaults.purchasePrice ?? '',
  remarks: line.remarks || '',
});

const emptyLine = (defaults = {}) => ({
  individualPartId: null,
  partSrNo: '',
  barcode: '',
  source: 'MARKET',
  stockPickIndividualPartId: null,
  damagedFlag: false,
  returnedFlag: false,
  vendorDamageReturn: false,
  returnPartSrNo: '',
  replacedId: null,
  received: false,
  salesPrice: defaults.salesPrice ?? '',
  purchasePrice: defaults.purchasePrice ?? '',
  remarks: '',
});

const buildDraftLines = (qty, defaults = {}) => {
  const count = qty > 0 ? qty : 1;
  return Array.from({ length: count }, () => emptyLine(defaults));
};

export default function TicketOrderPartsModal({ open, onClose, ticketPart }) {
  const queryClient = useQueryClient();
  const [orderData, setOrderData] = useState(null);
  const [lines, setLines] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState('');

  const { data: catalogPrices } = useQuery({
    queryKey: ['inventory-prices', ticketPart?.partCatId],
    queryFn: async () => {
      const res = await api.get(`/inventory/prices/${ticketPart.partCatId}`);
      return res.data?.data || res.data || null;
    },
    enabled: open && !!ticketPart?.partCatId,
    staleTime: 1000 * 60 * 5,
  });

  const priceDefaults = {
    salesPrice: catalogPrices?.salesPrice ?? '',
    purchasePrice: catalogPrices?.purchasePrice ?? '',
  };

  const applyOrderResponse = (data, defaults = priceDefaults) => {
    setOrderData(data);
    setRemarks(data?.remarks || '');
    setLines((data?.lines || []).map((line) => mapLineFromApi(line, defaults)));
  };

  const loadOrDraft = async (defaults = priceDefaults) => {
    setLoading(true);
    setSaveError('');
    try {
      const res = await api.get(`/parts-orders/ticket-part/${ticketPart.ticketPartId}`);
      const data = res.data?.data || res.data;
      applyOrderResponse(data, defaults);
    } catch {
      const qty = ticketPart.quantity > 0 ? ticketPart.quantity : 1;
      setOrderData({
        orderId: null,
        ticketId: ticketPart.ticketId,
        partCatId: ticketPart.partCatId,
        ticketPartId: ticketPart.ticketPartId,
        partName: ticketPart.partName,
        deviceTypeName: ticketPart.deviceTypeName,
        brandName: ticketPart.brandName,
        sku: ticketPart.sku,
        quantity: qty,
        status: 'DRAFT',
        remarks: '',
      });
      setRemarks('');
      setLines(buildDraftLines(qty, defaults));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && ticketPart) {
      setOrderData(null);
      setLines([]);
      loadOrDraft(priceDefaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ticketPart?.ticketPartId]);

  useEffect(() => {
    if (!catalogPrices || !lines.length) return;
    const defSales = catalogPrices.salesPrice;
    const defPurchase = catalogPrices.purchasePrice;
    if (defSales == null && defPurchase == null) return;

    setLines((prev) => {
      let changed = false;
      const next = prev.map((line) => {
        const patch = {};
        if ((line.salesPrice === '' || line.salesPrice == null) && defSales != null) {
          patch.salesPrice = defSales;
        }
        if ((line.purchasePrice === '' || line.purchasePrice == null) && defPurchase != null) {
          patch.purchasePrice = defPurchase;
        }
        if (!Object.keys(patch).length) return line;
        changed = true;
        return { ...line, ...patch };
      });
      return changed ? next : prev;
    });
  }, [catalogPrices]);

  const { data: stockOptions = [] } = useQuery({
    queryKey: ['in-stock-options', ticketPart?.partCatId],
    queryFn: async () => {
      const res = await api.get('/inventory/in-stock/available', {
        params: { partCatId: ticketPart.partCatId },
      });
      return res.data?.data || res.data || [];
    },
    enabled: open && !!ticketPart?.partCatId,
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (orderData?.orderId) {
        return api.put(`/parts-orders/${orderData.orderId}/save`, payload);
      }
      return api.post('/parts-orders/create', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-parts', ticketPart.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['parts-orders'] });
      setSaveError('');
      onClose();
    },
    onError: (error) => {
      setSaveError(error.response?.data?.message || error.message || 'Failed to save order');
    },
  });

  const updateLine = (index, patch) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const buildPayload = () => ({
    orderId: orderData?.orderId || null,
    ticketPartId: ticketPart.ticketPartId,
    ticketId: ticketPart.ticketId,
    partCatId: ticketPart.partCatId,
    quantity: orderData?.quantity || ticketPart.quantity || lines.length,
    remarks,
    lines: lines.map((l) => ({
      individualPartId: l.individualPartId,
      partSrNo: l.partSrNo || null,
      barcode: l.barcode || null,
      source: l.source,
      stockPickIndividualPartId: l.stockPickIndividualPartId,
      damagedFlag: l.damagedFlag,
      returnedFlag: l.returnedFlag,
      vendorDamageReturn: l.vendorDamageReturn,
      returnPartSrNo: l.returnPartSrNo || null,
      replacedId: l.replacedId,
      received: l.received,
      salesPrice: l.salesPrice !== '' ? Number(l.salesPrice) : null,
      purchasePrice: l.purchasePrice !== '' ? Number(l.purchasePrice) : null,
      remarks: l.remarks || null,
    })),
  });

  const validateBeforeSave = () => {
    const missing = lines.findIndex(
      (l) => l.received && !(l.partSrNo && String(l.partSrNo).trim()),
    );
    if (missing >= 0) {
      setSaveError(`Unit ${missing + 1}: Serial No is required when Received is checked`);
      return false;
    }
    setSaveError('');
    return true;
  };

  const handleSave = () => {
    if (!validateBeforeSave()) return;
    saveMutation.mutate(buildPayload());
  };

  const showContent = !loading && orderData;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Order Parts — {ticketPart?.partName}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : showContent ? (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Typography sx={{ fontSize: 13 }}>
                  <strong>Order #</strong> {orderData.orderId || 'New (save to create)'}
                </Typography>
                <Chip size="small" label={orderData.status || 'DRAFT'} />
                <Typography sx={{ fontSize: 13 }}>
                  <strong>Qty</strong> {orderData.quantity}
                </Typography>
                <Typography sx={{ fontSize: 13 }}>
                  {[orderData.brandName, orderData.deviceTypeName, orderData.sku].filter(Boolean).join(' · ')}
                </Typography>
              </Stack>
              <TextField
                label="Order Remarks"
                fullWidth
                size="small"
                sx={{ mt: 2 }}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </Paper>

            <Divider />

            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Parts Master Lines</Typography>

            {lines.map((line, index) => (
              <Paper key={line.individualPartId || `draft-${index}`} variant="outlined" sx={{ p: 2 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 1 }}>
                  Unit {index + 1}
                  {line.individualPartId ? ` (ID: ${line.individualPartId})` : ''}
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField
                      select
                      label="Source"
                      size="small"
                      value={line.source}
                      onChange={(e) => updateLine(index, { source: e.target.value })}
                      sx={{ minWidth: 140 }}
                    >
                      {SOURCES.map((s) => (
                        <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="Serial No"
                      size="small"
                      value={line.partSrNo}
                      onChange={(e) => updateLine(index, { partSrNo: e.target.value })}
                      required={line.received}
                      error={line.received && !String(line.partSrNo || '').trim()}
                      helperText={
                        line.received && !String(line.partSrNo || '').trim()
                          ? 'Required when Received is checked'
                          : undefined
                      }
                    />
                    <TextField
                      label="Barcode"
                      size="small"
                      value={line.barcode}
                      onChange={(e) => updateLine(index, { barcode: e.target.value })}
                    />
                  </Stack>

                  {line.source === 'STOCK' && (
                    <Autocomplete
                      size="small"
                      options={stockOptions}
                      getOptionLabel={(o) => `${o.individualPartId} — ${o.partSrNo || o.barcode || 'no sr'}`}
                      value={stockOptions.find((o) => o.individualPartId === line.stockPickIndividualPartId) || null}
                      onChange={(_, val) => updateLine(index, {
                        stockPickIndividualPartId: val?.individualPartId || null,
                        partSrNo: val?.partSrNo || line.partSrNo,
                        salesPrice: val?.salesPrice ?? line.salesPrice ?? priceDefaults.salesPrice,
                        purchasePrice: val?.purchasePrice ?? line.purchasePrice ?? priceDefaults.purchasePrice,
                      })}
                      renderInput={(params) => <TextField {...params} label="Stock Part ID" />}
                    />
                  )}

                  {(line.source === 'MARKET' || line.source === 'VENDOR' || line.source === 'STOCK') && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <TextField
                        label="Sales Price"
                        type="number"
                        size="small"
                        value={line.salesPrice}
                        onChange={(e) => updateLine(index, { salesPrice: e.target.value })}
                        inputProps={{ min: 0, step: '0.01' }}
                      />
                      <TextField
                        label="Purchase Price"
                        type="number"
                        size="small"
                        value={line.purchasePrice}
                        onChange={(e) => updateLine(index, { purchasePrice: e.target.value })}
                        inputProps={{ min: 0, step: '0.01' }}
                      />
                    </Stack>
                  )}

                  {line.source === 'VENDOR' && (
                    <Stack spacing={1}>
                      <FormControlLabel
                        control={(
                          <Checkbox
                            checked={line.vendorDamageReturn}
                            onChange={(e) => updateLine(index, { vendorDamageReturn: e.target.checked })}
                          />
                        )}
                        label="Vendor damage return"
                      />
                      {line.vendorDamageReturn && (
                        <TextField
                          label="Return Part Sr No"
                          size="small"
                          value={line.returnPartSrNo}
                          onChange={(e) => updateLine(index, { returnPartSrNo: e.target.value })}
                        />
                      )}
                    </Stack>
                  )}

                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <FormControlLabel
                      control={(
                        <Checkbox
                          checked={line.damagedFlag}
                          onChange={(e) => updateLine(index, { damagedFlag: e.target.checked })}
                        />
                      )}
                      label="Damaged"
                    />
                    <FormControlLabel
                      control={(
                        <Checkbox
                          checked={line.returnedFlag}
                          onChange={(e) => updateLine(index, { returnedFlag: e.target.checked })}
                        />
                      )}
                      label="Returned"
                    />
                    <FormControlLabel
                      control={(
                        <Checkbox
                          checked={line.received}
                          onChange={(e) => updateLine(index, { received: e.target.checked })}
                        />
                      )}
                      label="Received"
                    />
                  </Stack>

                  <TextField
                    label="Replaced ID (damaged unit)"
                    type="number"
                    size="small"
                    value={line.replacedId ?? ''}
                    onChange={(e) => updateLine(index, {
                      replacedId: e.target.value ? Number(e.target.value) : null,
                    })}
                  />
                </Stack>
              </Paper>
            ))}

            {saveError ? (
              <Typography sx={{ fontSize: 13, color: 'error.main' }}>{saveError}</Typography>
            ) : null}
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!orderData || saveMutation.isPending}
        >
          {saveMutation.isPending ? <CircularProgress size={22} color="inherit" /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
