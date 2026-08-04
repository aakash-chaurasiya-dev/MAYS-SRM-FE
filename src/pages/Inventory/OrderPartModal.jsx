import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControlLabel, Checkbox, MenuItem, CircularProgress, Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const SOURCES = [
  { value: 'VENDOR', label: 'VENDOR (warranty — no stock change)' },
  { value: 'MARKET', label: 'MARKET (ticket buy — no stock change)' },
  { value: 'STOCK_IN', label: 'STOCK_IN (warehouse restock ++)' },
  { value: 'STOCK_OUT', label: 'STOCK_OUT (use from stock --)' },
];

const INITIAL_FORM = {
  partId: '',
  source: 'MARKET',
  ticketId: '',
  quantity: 1,
  productId: '',
  partName: '',
  statusId: '',
  unitCost: '',
  defectiveReturned: false,
  customerApproved: false,
  receiveDate: '',
  usedDate: '',
  remarks: '',
};

const isOutOfWarrantyTicket = (ticket) => {
  const name = (
    ticket?.warrantyTypeName ||
    ticket?.warrantyType ||
    ''
  ).toString().toLowerCase();
  return name.includes('out') && name.includes('warrant');
};

const toLocalDateTimeInput = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 16);
};

/**
 * Create / update modal for part orders.
 * Uses shared TanStack Query caches for statuses, tickets, and inventory.
 */
export default function OrderPartModal({ open, onClose, mode = 'create', part = null }) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isOutOfWarranty, setIsOutOfWarranty] = useState(false);

  const { data: statuses = [] } = useQuery({
    queryKey: ['statuses'],
    queryFn: async () => {
      const response = await api.get('/statuses');
      return response.data?.data || response.data || [];
    },
    select: (data) =>
      (data || []).filter((s) => (s.statusType || '').toLowerCase() === 'parts'),
    staleTime: 1000 * 60 * 60,
    enabled: open,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const response = await api.get('/tickets');
      return response.data?.data || response.data || [];
    },
    staleTime: 1000 * 60 * 5,
    enabled: open,
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await api.get('/inventory');
      return response.data?.data || response.data || [];
    },
    select: (data) => (data || []).filter((i) => i.isActive !== false),
    staleTime: 1000 * 60 * 5,
    enabled: open,
  });

  const ticketIdForLookup =
    open && mode === 'create' && formData.source !== 'STOCK_IN' && formData.ticketId
      ? formData.ticketId
      : null;

  const { data: selectedTicket, isFetching: ticketLoading } = useQuery({
    queryKey: ['ticket', ticketIdForLookup],
    queryFn: async () => {
      const response = await api.get(`/tickets/${ticketIdForLookup}`);
      return response.data?.data || response.data;
    },
    enabled: !!ticketIdForLookup,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!open) return;

    if (mode === 'create') {
      setFormData(INITIAL_FORM);
      setIsOutOfWarranty(false);
      return;
    }

    if (!part) return;

    let matchedStatusId = part.statusId || '';
    if (!matchedStatusId && part.statusName) {
      const match = statuses.find((s) => s.statusName === part.statusName);
      if (match) matchedStatusId = match.statusId;
    }

    let matchedProductId = part.productId || '';
    if (!matchedProductId && part.productName) {
      const match = inventory.find((i) => i.productName === part.productName);
      if (match) matchedProductId = match.productId;
    }

    setFormData({
      partId: part.partId || '',
      source: part.source || 'MARKET',
      ticketId: part.ticketId || '',
      quantity: part.quantity || 1,
      productId: matchedProductId,
      partName: part.partName || '',
      statusId: matchedStatusId,
      unitCost: part.unitCost ?? '',
      defectiveReturned: part.defectiveReturned || false,
      customerApproved: part.customerApproved || false,
      receiveDate: toLocalDateTimeInput(part.receiveDate),
      usedDate: toLocalDateTimeInput(part.usedDate),
      remarks: part.remarks || '',
    });
    setIsOutOfWarranty(part.source !== 'VENDOR');
  }, [open, mode, part, statuses, inventory]);

  useEffect(() => {
    if (!selectedTicket || mode !== 'create') return;

    const isOut = isOutOfWarrantyTicket(selectedTicket);
    const orderedStatus = statuses.find((s) => s.statusName?.toLowerCase() === 'ordered');
    const usedStatus = statuses.find((s) =>
      ['used', 'fitted', 'delivered'].includes(s.statusName?.toLowerCase())
    );

    setIsOutOfWarranty(isOut);
    setFormData((prev) => {
      let nextSource = prev.source;
      if (isOut) {
        if (prev.source === 'VENDOR') nextSource = 'MARKET';
      } else {
        nextSource = 'VENDOR';
      }

      let nextStatus = prev.statusId;
      if (!nextStatus && orderedStatus) nextStatus = orderedStatus.statusId;
      if (nextSource === 'STOCK_OUT' && usedStatus) nextStatus = usedStatus.statusId;

      return {
        ...prev,
        source: nextSource,
        statusId: nextStatus,
        defectiveReturned: isOut ? false : prev.defectiveReturned,
      };
    });
  }, [selectedTicket, statuses, mode]);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (mode === 'create') {
        return api.post('/parts', payload);
      }
      return api.put(`/parts/${formData.partId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      if (formData.ticketId) {
        queryClient.invalidateQueries({ queryKey: ['ticket-parts', String(formData.ticketId)] });
        queryClient.invalidateQueries({ queryKey: ['ticket-parts', formData.ticketId] });
      }
      onClose(true);
    },
    onError: (error) => {
      alert(error.response?.data?.message || error.message || 'Failed to save part order');
    },
  });

  const ticketRequired = formData.source !== 'STOCK_IN';
  const showDefectiveReturn = formData.source === 'VENDOR';
  const showUnitCost = formData.source === 'MARKET' || formData.source === 'STOCK_IN';
  const productRequired = formData.source === 'STOCK_IN' || formData.source === 'STOCK_OUT';

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
      if (name === 'source' && value === 'STOCK_IN') {
        next.ticketId = '';
        next.defectiveReturned = false;
      }
      if (name === 'source' && value !== 'VENDOR') {
        next.defectiveReturned = false;
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      source: formData.source,
      ticketId: formData.source === 'STOCK_IN' ? null : (formData.ticketId || null),
      quantity: Number(formData.quantity),
      productId: formData.productId || null,
      partName: formData.partName || null,
      statusId: formData.statusId,
      unitCost: formData.unitCost === '' ? null : Number(formData.unitCost),
      defectiveReturned: formData.source === 'VENDOR' ? formData.defectiveReturned : false,
      customerApproved: formData.customerApproved,
      receiveDate: formData.receiveDate || null,
      usedDate: formData.usedDate || null,
      remarks: formData.remarks || null,
    });
  };

  const handleClose = () => {
    if (saveMutation.isPending) return;
    onClose(false);
  };

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.8, mt: 2,
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, py: 2, px: 3 }}>
        {mode === 'create' ? 'Create New Part Order' : 'Update Part Order'}
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box component="form" id="part-form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Box>
            <Typography sx={{ ...lbl, mt: 0 }}>Source</Typography>
            <TextField select name="source" required value={formData.source} onChange={handleFormChange} fullWidth size="small">
              {SOURCES.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Ticket ID {ticketRequired ? '*' : '(not for STOCK_IN)'}</Typography>
              <TextField
                select
                name="ticketId"
                value={formData.ticketId}
                onChange={handleFormChange}
                fullWidth
                size="small"
                required={ticketRequired}
                disabled={!ticketRequired}
                helperText={ticketLoading ? 'Fetching...' : (isOutOfWarranty ? 'Out of warranty ticket' : '')}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {tickets.map((ticket) => (
                  <MenuItem key={ticket.ticketId || ticket.id} value={ticket.ticketId || ticket.id}>
                    {ticket.ticketId || ticket.id}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Product (Inventory) {productRequired ? '*' : ''}</Typography>
              <TextField
                select
                name="productId"
                value={formData.productId}
                onChange={handleFormChange}
                fullWidth
                size="small"
                required={productRequired}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {inventory.map((inv) => (
                  <MenuItem key={inv.productId || inv.id} value={inv.productId || inv.id}>
                    {inv.productName}{inv.stock != null ? ` (stock: ${inv.stock})` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>

          <Box>
            <Typography sx={{ ...lbl, mt: 0 }}>Part Name (creates catalog entry if new)</Typography>
            <TextField
              name="partName"
              value={formData.partName}
              onChange={handleFormChange}
              fullWidth
              size="small"
              placeholder="Optional if product selected"
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Quantity</Typography>
              <TextField
                name="quantity"
                type="number"
                required
                value={formData.quantity}
                onChange={handleFormChange}
                fullWidth
                size="small"
                inputProps={{ min: 1 }}
              />
            </Box>
            {showUnitCost && (
              <Box>
                <Typography sx={{ ...lbl, mt: 0 }}>Unit Cost</Typography>
                <TextField
                  name="unitCost"
                  type="number"
                  value={formData.unitCost}
                  onChange={handleFormChange}
                  fullWidth
                  size="small"
                  inputProps={{ min: 0, step: '0.01' }}
                />
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: mode === 'update' ? '1fr 1fr' : '1fr', gap: 2 }}>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Status</Typography>
              <TextField
                select
                name="statusId"
                required
                value={formData.statusId}
                onChange={handleFormChange}
                fullWidth
                size="small"
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {statuses.map((status) => (
                  <MenuItem key={status.statusId} value={status.statusId}>
                    {status.statusName}
                  </MenuItem>
                ))}
              </TextField>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5 }}>
                STOCK_IN: set Received/Delivered to ++ stock. STOCK_OUT: set Used/Fitted to -- stock.
              </Typography>
            </Box>
            {mode === 'update' && (
              <Box>
                <Typography sx={{ ...lbl, mt: 0 }}>Receive Date</Typography>
                <TextField
                  name="receiveDate"
                  type="datetime-local"
                  value={formData.receiveDate}
                  onChange={handleFormChange}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            )}
          </Box>

          <Box>
            <Typography sx={{ ...lbl, mt: 0 }}>Remarks</Typography>
            <TextField
              name="remarks"
              value={formData.remarks}
              onChange={handleFormChange}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          </Box>

          {formData.source === 'MARKET' && (
            <FormControlLabel
              control={
                <Checkbox
                  name="customerApproved"
                  checked={formData.customerApproved}
                  onChange={handleFormChange}
                  color="primary"
                />
              }
              label={<Typography sx={{ fontSize: '13px' }}>Customer approved</Typography>}
            />
          )}

          {showDefectiveReturn && (
            <FormControlLabel
              control={
                <Checkbox
                  name="defectiveReturned"
                  checked={formData.defectiveReturned}
                  onChange={handleFormChange}
                  color="primary"
                />
              }
              label={<Typography sx={{ fontSize: '13px' }}>Defective part returned to vendor</Typography>}
            />
          )}
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={saveMutation.isPending} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="part-form"
          variant="contained"
          disabled={saveMutation.isPending}
          sx={{ textTransform: 'none', minWidth: 100 }}
        >
          {saveMutation.isPending
            ? <CircularProgress size={24} color="inherit" />
            : (mode === 'create' ? 'Create Order' : 'Update Order')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
