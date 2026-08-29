import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Autocomplete, CircularProgress, Box,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';

export default function TicketPartAddModal({ open, onClose, ticketId }) {
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [remark, setRemark] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['inventory-products', searchTerm],
    queryFn: async () => {
      const res = await api.get('/inventory/products/search', { params: { term: searchTerm || '', limit: 50 } });
      return res.data?.data || res.data || [];
    },
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/ticket-parts', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-parts', ticketId] });
      handleClose();
    },
  });

  const handleClose = () => {
    setSelectedProduct(null);
    setQuantity(1);
    setRemark('');
    setSearchTerm('');
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedProduct?.partCatId) return;
    createMutation.mutate({
      ticketId: Number(ticketId),
      partCatId: selectedProduct.partCatId,
      quantity: Number(quantity) || 1,
      remark: remark || null,
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Suggested Part</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Autocomplete
            options={products}
            loading={productsLoading}
            getOptionLabel={(o) => o.partName || ''}
            value={selectedProduct}
            onChange={(_, val) => setSelectedProduct(val)}
            onInputChange={(_, val) => setSearchTerm(val)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Product"
                placeholder="Search part name or SKU"
              />
            )}
          />
          <TextField
            label="Quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Remark"
            multiline
            minRows={2}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!selectedProduct || createMutation.isPending}
        >
          {createMutation.isPending ? 'Saving…' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
