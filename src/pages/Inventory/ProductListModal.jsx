import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, CircularProgress, Divider, FormControlLabel, Checkbox,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const INITIAL_FORM = {
  partCatId: '',
  partName: '',
  sku: '',
  deviceTypeId: '',
  brandId: '',
  hsnCode: '',
  specification: '',
  descr: '',
  stocks: 0,
  minStock: '',
  maxStock: '',
  isActive: true,
};

export default function ProductListModal({ open, onClose, mode = 'create', item = null }) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [brandsAvailable, setBrandsAvailable] = useState(true);

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

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      try {
        const response = await api.get('/brands');
        setBrandsAvailable(true);
        return response.data?.data || response.data || [];
      } catch {
        setBrandsAvailable(false);
        return [];
      }
    },
    select: (data) =>
      (data || []).map((b, index) => ({
        ...b,
        id: b.brandId || b.id || `fallback-id-${index}`,
      })),
    staleTime: 1000 * 60 * 60,
    enabled: open,
    retry: false,
  });

  useEffect(() => {
    if (!open) return;

    if (mode === 'create') {
      setFormData(INITIAL_FORM);
      return;
    }

    if (!item) return;

    let matchedDeviceTypeId = item.deviceTypeId || '';
    if (!matchedDeviceTypeId && item.deviceTypeName) {
      const match = deviceTypes.find(
        (dt) => dt.deviceTypeName === item.deviceTypeName || dt.name === item.deviceTypeName
      );
      if (match) matchedDeviceTypeId = match.deviceTypeId || match.id;
    }

    let matchedBrandId = item.brandId || '';
    if (!matchedBrandId && item.brandName) {
      const match = brands.find(
        (b) => b.brandName === item.brandName || b.name === item.brandName
      );
      if (match) matchedBrandId = match.brandId || match.id;
    }

    setFormData({
      partCatId: item.partCatId || '',
      partName: item.partName || '',
      sku: item.sku || '',
      deviceTypeId: matchedDeviceTypeId,
      brandId: matchedBrandId,
      hsnCode: item.hsnCode || '',
      specification: item.specification || '',
      descr: item.descr || '',
      stocks: item.stocks ?? 0,
      minStock: item.minStock ?? '',
      maxStock: item.maxStock ?? '',
      isActive: item.isActive !== false,
    });
  }, [open, mode, item, deviceTypes, brands]);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (mode === 'create') {
        return api.post('/inventory/products', payload);
      }
      return api.put(`/inventory/products/${formData.partCatId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      onClose(true);
    },
    onError: (error) => {
      console.error(`Failed to ${mode} product:`, error);
      alert(error.response?.data?.message || error.message || 'Failed to save product');
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
      partName: formData.partName,
      sku: formData.sku || null,
      deviceTypeId: formData.deviceTypeId || null,
      brandId: formData.brandId || null,
      hsnCode: formData.hsnCode || null,
      specification: formData.specification || null,
      descr: formData.descr || null,
      stocks: formData.stocks === '' ? 0 : Number(formData.stocks),
      minStock: formData.minStock === '' ? null : Number(formData.minStock),
      maxStock: formData.maxStock === '' ? null : Number(formData.maxStock),
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
        {mode === 'create' ? 'Add Product' : 'Update Product'}
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box component="form" id="product-list-form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Part Name</Typography>
              <TextField
                name="partName"
                required
                value={formData.partName}
                onChange={handleFormChange}
                fullWidth
                size="small"
              />
            </Box>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>SKU</Typography>
              <TextField
                name="sku"
                value={formData.sku}
                onChange={handleFormChange}
                fullWidth
                size="small"
              />
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: brandsAvailable ? '1fr 1fr' : '1fr', gap: 2 }}>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Device Type</Typography>
              <TextField
                select
                name="deviceTypeId"
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
            {brandsAvailable && (
              <Box>
                <Typography sx={{ ...lbl, mt: 0 }}>Brand</Typography>
                <TextField
                  select
                  name="brandId"
                  value={formData.brandId}
                  onChange={handleFormChange}
                  fullWidth
                  size="small"
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {brands.map((b) => (
                    <MenuItem key={b.brandId || b.id} value={b.brandId || b.id}>
                      {b.brandName || b.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Stocks</Typography>
              <TextField
                name="stocks"
                type="number"
                value={formData.stocks}
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
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Max Stock</Typography>
              <TextField
                name="maxStock"
                type="number"
                value={formData.maxStock}
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
          form="product-list-form"
          variant="contained"
          disabled={saveMutation.isPending}
          sx={{ textTransform: 'none', minWidth: 100 }}
        >
          {saveMutation.isPending
            ? <CircularProgress size={24} color="inherit" />
            : (mode === 'create' ? 'Save Product' : 'Update Product')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
