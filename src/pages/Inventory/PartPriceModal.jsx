import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress, Divider, Autocomplete,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const INITIAL_FORM = {
  partCatId: '',
  salesPrice: '',
  purchasePrice: '',
  currency: 'INR',
};

export default function PartPriceModal({ open, onClose, mode = 'create', item = null }) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['inventory-products-search', searchTerm],
    queryFn: async () => {
      const res = await api.get('/inventory/products/search', {
        params: { term: searchTerm || '', limit: 50 },
      });
      return res.data?.data || res.data || [];
    },
    enabled: open && mode === 'create',
  });

  useEffect(() => {
    if (!open) return;

    if (mode === 'create') {
      setFormData(INITIAL_FORM);
      setSelectedProduct(null);
      setSearchTerm('');
      return;
    }

    if (!item) return;

    setFormData({
      partCatId: item.partCatId || '',
      salesPrice: item.salesPrice ?? '',
      purchasePrice: item.purchasePrice ?? '',
      currency: item.currency || 'INR',
    });
    setSelectedProduct({
      partCatId: item.partCatId,
      partName: item.partName,
      sku: item.sku,
    });
  }, [open, mode, item]);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (mode === 'create') {
        return api.post('/inventory/prices', payload);
      }
      return api.put(`/inventory/prices/${formData.partCatId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-prices'] });
      onClose(true);
    },
    onError: (error) => {
      console.error(`Failed to ${mode} part price:`, error);
      alert(error.response?.data?.message || error.message || 'Failed to save part price');
    },
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const partCatId = mode === 'create' ? selectedProduct?.partCatId : formData.partCatId;
    if (!partCatId) return;

    saveMutation.mutate({
      partCatId: Number(partCatId),
      salesPrice: formData.salesPrice === '' ? null : Number(formData.salesPrice),
      purchasePrice: formData.purchasePrice === '' ? null : Number(formData.purchasePrice),
      currency: formData.currency || 'INR',
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
        {mode === 'create' ? 'Add Part Price' : 'Update Part Price'}
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box component="form" id="part-price-form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Box>
            <Typography sx={{ ...lbl, mt: 0 }}>Product</Typography>
            {mode === 'create' ? (
              <Autocomplete
                options={products}
                loading={productsLoading}
                getOptionLabel={(o) => (o.sku ? `${o.partName} (${o.sku})` : o.partName || '')}
                value={selectedProduct}
                onChange={(_, val) => setSelectedProduct(val)}
                onInputChange={(_, val) => setSearchTerm(val)}
                isOptionEqualToValue={(opt, val) => opt.partCatId === val.partCatId}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    size="small"
                    placeholder="Search part name or SKU"
                  />
                )}
              />
            ) : (
              <TextField
                value={item?.partName || selectedProduct?.partName || formData.partCatId}
                fullWidth
                size="small"
                disabled
              />
            )}
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Sales Price</Typography>
              <TextField
                name="salesPrice"
                type="number"
                value={formData.salesPrice}
                onChange={handleFormChange}
                fullWidth
                size="small"
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Box>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Purchase Price</Typography>
              <TextField
                name="purchasePrice"
                type="number"
                value={formData.purchasePrice}
                onChange={handleFormChange}
                fullWidth
                size="small"
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Box>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Currency</Typography>
              <TextField
                name="currency"
                value={formData.currency}
                onChange={handleFormChange}
                fullWidth
                size="small"
              />
            </Box>
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
          form="part-price-form"
          variant="contained"
          disabled={saveMutation.isPending || (mode === 'create' && !selectedProduct)}
          sx={{ textTransform: 'none', minWidth: 100 }}
        >
          {saveMutation.isPending
            ? <CircularProgress size={24} color="inherit" />
            : (mode === 'create' ? 'Save Price' : 'Update Price')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
