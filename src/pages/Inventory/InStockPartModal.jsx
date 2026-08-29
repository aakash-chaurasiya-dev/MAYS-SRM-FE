import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, CircularProgress, Divider,
  FormControlLabel, Checkbox, Autocomplete,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const INITIAL_FORM = {
  individualPartId: '',
  partCatId: '',
  partSrNo: '',
  barcode: '',
  source: 'MARKET',
  received: true,
  salesPrice: '',
  purchasePrice: '',
  remarks: '',
};

export default function InStockPartModal({ open, onClose, mode = 'create', item = null }) {
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
    enabled: open,
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
      individualPartId: item.individualPartId || '',
      partCatId: item.partCatId || '',
      partSrNo: item.partSrNo || '',
      barcode: item.barcode || '',
      source: item.source || 'MARKET',
      received: item.received !== false,
      salesPrice: item.salesPrice ?? '',
      purchasePrice: item.purchasePrice ?? '',
      remarks: item.remarks || '',
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
        return api.post('/inventory/in-stock', payload);
      }
      return api.put(`/inventory/in-stock/${formData.individualPartId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-in-stock'] });
      onClose(true);
    },
    onError: (error) => {
      console.error(`Failed to ${mode} in-stock part:`, error);
      alert(error.response?.data?.message || error.message || 'Failed to save in-stock part');
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
    const partCatId = selectedProduct?.partCatId || formData.partCatId;
    if (!partCatId) return;

    saveMutation.mutate({
      partCatId: Number(partCatId),
      partSrNo: formData.partSrNo || null,
      barcode: formData.barcode || null,
      source: formData.source || 'MARKET',
      received: formData.received,
      salesPrice: formData.salesPrice === '' ? null : Number(formData.salesPrice),
      purchasePrice: formData.purchasePrice === '' ? null : Number(formData.purchasePrice),
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
        {mode === 'create' ? 'Add In-Stock Part' : 'Update In-Stock Part'}
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box component="form" id="in-stock-form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Box>
            <Typography sx={{ ...lbl, mt: 0 }}>Product</Typography>
            <Autocomplete
              options={products}
              loading={productsLoading}
              getOptionLabel={(o) => (o.sku ? `${o.partName} (${o.sku})` : o.partName || '')}
              value={selectedProduct}
              onChange={(_, val) => {
                setSelectedProduct(val);
                if (mode === 'create' && val) {
                  setFormData((prev) => ({
                    ...prev,
                    partCatId: val.partCatId || '',
                    salesPrice: val.defaultSalesPrice ?? '',
                    purchasePrice: val.defaultPurchasePrice ?? '',
                  }));
                }
              }}
              onInputChange={(_, val) => setSearchTerm(val)}
              isOptionEqualToValue={(opt, val) => opt.partCatId === val.partCatId}
              disabled={mode === 'update'}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  size="small"
                  placeholder="Search part name or SKU"
                />
              )}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Serial No</Typography>
              <TextField
                name="partSrNo"
                value={formData.partSrNo}
                onChange={handleFormChange}
                fullWidth
                size="small"
              />
            </Box>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Barcode</Typography>
              <TextField
                name="barcode"
                value={formData.barcode}
                onChange={handleFormChange}
                fullWidth
                size="small"
              />
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Source</Typography>
              <TextField
                select
                name="source"
                value={formData.source}
                onChange={handleFormChange}
                fullWidth
                size="small"
              >
                <MenuItem value="MARKET">MARKET</MenuItem>
                <MenuItem value="VENDOR">VENDOR</MenuItem>
              </TextField>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', pb: 0.5 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="received"
                    checked={formData.received}
                    onChange={handleFormChange}
                    color="primary"
                  />
                }
                label={<Typography sx={{ fontSize: '13px' }}>Received</Typography>}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
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
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={saveMutation.isPending} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="in-stock-form"
          variant="contained"
          disabled={saveMutation.isPending || !selectedProduct}
          sx={{ textTransform: 'none', minWidth: 100 }}
        >
          {saveMutation.isPending
            ? <CircularProgress size={24} color="inherit" />
            : (mode === 'create' ? 'Save Part' : 'Update Part')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
