import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem, TextField, FormControl, InputLabel, Box } from '@mui/material';

export default function ChargeEditModal({
  open,
  onClose,
  item,
  chargeTypes = [],
  products = [],
  services = [],
  statuses = [],
  paymentModes = [],
  onSave,
  getChargeTypeInfo,
  disabled
}) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  if (!item) return null;

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Reset product/service if charge type changes
      if (field === 'chargeTypeId') {
        updated.productId = '';
        updated.serviceChargeId = '';
      }
      // Update amount based on product/service selection
      if (field === 'productId') {
        const p = products.find(prod => prod.productId === value);
        if (p) updated.amount = p.sellingPrice;
      }
      if (field === 'serviceChargeId') {
        const s = services.find(serv => serv.chargeId === value);
        if (s) updated.amount = s.amount;
      }
      
      // Clear payment mode if status is not Paid
      if (field === 'statusId') {
        const selectedStatus = statuses.find(s => s.statusId === value);
        const isPaidStatus = selectedStatus && selectedStatus.statusName?.toLowerCase() === 'paid';
        if (!isPaidStatus) {
           updated.paymentModeId = '';
        }
      }
      
      return updated;
    });
  };

  const { isProduct, isService } = getChargeTypeInfo(formData.chargeTypeId);
  
  const selectedStatus = statuses.find(s => s.statusId === formData.statusId);
  const isPaid = selectedStatus && selectedStatus.statusName?.toLowerCase() === 'paid';
  const isFormValid = !isPaid || (isPaid && !!formData.paymentModeId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Charge Details</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Charge Type</InputLabel>
            <Select
              label="Charge Type"
              value={formData.chargeTypeId || ''}
              disabled={disabled}
              onChange={(e) => handleChange('chargeTypeId', e.target.value)}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {chargeTypes.map(ct => <MenuItem key={ct.chargeTypeId} value={ct.chargeTypeId}>{ct.chargeName}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Product</InputLabel>
            <Select
              label="Product"
              value={formData.productId || ''}
              disabled={disabled || !isProduct}
              onChange={(e) => handleChange('productId', e.target.value)}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {products.map(p => <MenuItem key={p.productId} value={p.productId}>{p.productName}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Service</InputLabel>
            <Select
              label="Service"
              value={formData.serviceChargeId || ''}
              disabled={disabled || !isService}
              onChange={(e) => handleChange('serviceChargeId', e.target.value)}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {services.map(s => <MenuItem key={s.chargeId} value={s.chargeId}>{s.descr}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={formData.statusId || ''}
              disabled={disabled}
              onChange={(e) => handleChange('statusId', e.target.value)}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {statuses.map(s => <MenuItem key={s.statusId} value={s.statusId}>{s.statusName}</MenuItem>)}
            </Select>
          </FormControl>

          {isPaid && (
            <FormControl fullWidth size="small" error={!formData.paymentModeId}>
              <InputLabel>Payment Mode *</InputLabel>
              <Select
                label="Payment Mode *"
                value={formData.paymentModeId || ''}
                disabled={disabled}
                onChange={(e) => handleChange('paymentModeId', e.target.value)}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {paymentModes.map(pm => <MenuItem key={pm.payModeId} value={pm.payModeId}>{pm.paymentMode}</MenuItem>)}
              </Select>
            </FormControl>
          )}

          <TextField
            label="Amount (₹)"
            type="number"
            size="small"
            fullWidth
            disabled={disabled}
            value={formData.amount || 0}
            onChange={(e) => handleChange('amount', e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={() => onSave(formData)} variant="contained" disabled={disabled || !isFormValid}>Apply</Button>
      </DialogActions>
    </Dialog>
  );
}
