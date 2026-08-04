import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, CircularProgress, Divider, FormControlLabel, Checkbox
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const INITIAL_FORM = {
  productId: '',
  productName: '',
  sku: '',
  deviceTypeId: '',
  specification: '',
  descr: '',
  sellingPrice: '',
  buyingPrice: '',
  stock: 0,
  minStock: '',
  hsnCode: '',
  branchId: '',
  isActive: true,
};

/**
 * Create / update modal for inventory products.
 * Uses shared TanStack Query caches for branches and device types.
 */
export default function InventoryModal({ open, onClose, mode = 'create', item = null }) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(INITIAL_FORM);

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await api.get('/branches');
      return response.data?.data || response.data || [];
    },
    select: (data) =>
      (data || []).map((b, index) => ({
        ...b,
        id: b.branchId || b.id || `fallback-id-${index}`,
      })),
    staleTime: 1000 * 60 * 60,
    enabled: open,
  });

  const { data: deviceTypes = [] } = useQuery({
    queryKey: ['deviceTypes'],
    queryFn: async () => {
      const response = await api.get('/devicetypes');
      return response.data?.data || response.data || [];
    },
    select: (data) =>
      (data || []).map((type, index) => ({
        ...type,
        id: type.deviceTypeId || `fallback-id-${index}`,
      })),
    staleTime: 1000 * 60 * 60,
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;

    if (mode === 'create') {
      setFormData(INITIAL_FORM);
      return;
    }

    if (!item) return;

    let matchedBranchId = item.branchId || '';
    if (!matchedBranchId && item.branchName) {
      const match = branches.find(
        (b) => b.branchName === item.branchName || b.name === item.branchName
      );
      if (match) matchedBranchId = match.branchId || match.id;
    }

    let matchedDeviceTypeId = item.deviceTypeId || '';
    if (!matchedDeviceTypeId && item.deviceTypeName) {
      const match = deviceTypes.find(
        (dt) => dt.deviceTypeName === item.deviceTypeName || dt.name === item.deviceTypeName
      );
      if (match) matchedDeviceTypeId = match.deviceTypeId || match.id;
    }

    setFormData({
      productId: item.productId || '',
      productName: item.productName || '',
      sku: item.sku || '',
      deviceTypeId: matchedDeviceTypeId,
      specification: item.specification || '',
      descr: item.descr || '',
      sellingPrice: item.sellingPrice || '',
      buyingPrice: item.buyingPrice || '',
      stock: item.stock ?? 0,
      minStock: item.minStock ?? '',
      hsnCode: item.hsnCode || '',
      branchId: matchedBranchId,
      isActive: item.isActive !== false,
    });
  }, [open, mode, item, branches, deviceTypes]);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (mode === 'create') {
        return api.post('/inventory', payload);
      }
      return api.put(`/inventory/${formData.productId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      onClose(true);
    },
    onError: (error) => {
      console.error(`Failed to ${mode} inventory item:`, error);
      alert(error.response?.data?.message || error.message || 'Failed to save inventory item');
    },
  });

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      productName: formData.productName,
      sku: formData.sku || null,
      deviceTypeId: formData.deviceTypeId || null,
      specification: formData.specification,
      descr: formData.descr,
      sellingPrice: formData.sellingPrice,
      buyingPrice: formData.buyingPrice,
      stock: formData.stock,
      minStock: formData.minStock === '' ? null : Number(formData.minStock),
      hsnCode: formData.hsnCode || null,
      branchId: formData.branchId,
      isActive: formData.isActive,
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
        {mode === 'create' ? 'Add Inventory Item' : 'Update Inventory Item'}
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box component="form" id="inventory-form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Product Name</Typography>
              <TextField
                name="productName"
                required
                value={formData.productName}
                onChange={handleFormChange}
                fullWidth
                size="small"
              />
            </Box>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>SKU / Part No</Typography>
              <TextField
                name="sku"
                value={formData.sku}
                onChange={handleFormChange}
                fullWidth
                size="small"
              />
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Device Type</Typography>
              <TextField
                select
                name="deviceTypeId"
                required
                value={formData.deviceTypeId}
                onChange={handleFormChange}
                fullWidth
                size="small"
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {deviceTypes.map((dt) => (
                  <MenuItem key={dt.deviceTypeId || dt.id} value={dt.deviceTypeId || dt.id}>
                    {dt.deviceTypeName || dt.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Branch</Typography>
              <TextField
                select
                name="branchId"
                required
                value={formData.branchId}
                onChange={handleFormChange}
                fullWidth
                size="small"
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {branches.map((b) => (
                  <MenuItem key={b.branchId || b.id} value={b.branchId || b.id}>
                    {b.branchName || b.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 2 }}>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Buying Price</Typography>
              <TextField
                name="buyingPrice"
                type="number"
                required
                value={formData.buyingPrice}
                onChange={handleFormChange}
                fullWidth
                size="small"
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Box>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Selling Price</Typography>
              <TextField
                name="sellingPrice"
                type="number"
                required
                value={formData.sellingPrice}
                onChange={handleFormChange}
                fullWidth
                size="small"
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Box>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Stock</Typography>
              <TextField
                name="stock"
                type="number"
                required
                value={formData.stock}
                onChange={handleFormChange}
                fullWidth
                size="small"
                inputProps={{ min: 0 }}
              />
            </Box>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Min Stock</Typography>
              <TextField
                name="minStock"
                type="number"
                value={formData.minStock}
                onChange={handleFormChange}
                fullWidth
                size="small"
                inputProps={{ min: 0 }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>HSN Code</Typography>
              <TextField
                name="hsnCode"
                value={formData.hsnCode}
                onChange={handleFormChange}
                fullWidth
                size="small"
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', pb: 0.5 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleFormChange}
                    color="primary"
                  />
                }
                label={<Typography sx={{ fontSize: '13px' }}>Active</Typography>}
              />
            </Box>
          </Box>

          <Box>
            <Typography sx={{ ...lbl, mt: 0 }}>Specification</Typography>
            <TextField
              name="specification"
              value={formData.specification}
              onChange={handleFormChange}
              fullWidth
              size="small"
            />
          </Box>

          <Box>
            <Typography sx={{ ...lbl, mt: 0 }}>Description</Typography>
            <TextField
              name="descr"
              value={formData.descr}
              onChange={handleFormChange}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          </Box>
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={saveMutation.isPending} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="inventory-form"
          variant="contained"
          disabled={saveMutation.isPending}
          sx={{ textTransform: 'none', minWidth: 100 }}
        >
          {saveMutation.isPending
            ? <CircularProgress size={24} color="inherit" />
            : (mode === 'create' ? 'Save Item' : 'Update Item')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
