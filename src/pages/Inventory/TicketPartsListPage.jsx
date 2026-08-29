import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Typography, Divider, CircularProgress, Autocomplete,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { List } from '../../stereotype/AbstractList';
import api from '../../services/api';
import DeleteConfirmDialog from '../../components/DeleteConfirmDialog';

function TicketPartListModal({ open, onClose, mode = 'create', item = null }) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [ticketId, setTicketId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [remark, setRemark] = useState('');
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
      setTicketId('');
      setQuantity(1);
      setRemark('');
      setSelectedProduct(null);
      setSearchTerm('');
      return;
    }
    if (!item) return;
    setTicketId(item.ticketId ?? '');
    setQuantity(item.quantity ?? 1);
    setRemark(item.remark || '');
    setSelectedProduct({
      partCatId: item.partCatId,
      partName: item.partName,
      sku: item.sku,
    });
  }, [open, mode, item]);

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (mode === 'create') return api.post('/ticket-parts', payload);
      return api.put(`/ticket-parts/${item.ticketPartId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-parts-list'] });
      onClose(true);
    },
    onError: (error) => {
      console.error(`Failed to ${mode} ticket part:`, error);
      alert(error.response?.data?.message || error.message || 'Failed to save ticket part');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct?.partCatId || !ticketId) return;
    saveMutation.mutate({
      ticketId: Number(ticketId),
      partCatId: selectedProduct.partCatId,
      quantity: Number(quantity) || 1,
      remark: remark || null,
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
        {mode === 'create' ? 'Add Ticket Part' : 'Update Ticket Part'}
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box component="form" id="ticket-part-list-form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Box>
            <Typography sx={{ ...lbl, mt: 0 }}>Ticket ID</Typography>
            <TextField
              type="number"
              required
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              fullWidth
              size="small"
              inputProps={{ min: 1 }}
              disabled={mode === 'update'}
            />
          </Box>
          <Box>
            <Typography sx={{ ...lbl, mt: 0 }}>Product</Typography>
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
          </Box>
          <Box>
            <Typography sx={{ ...lbl, mt: 0 }}>Quantity</Typography>
            <TextField
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              fullWidth
              size="small"
              inputProps={{ min: 1 }}
            />
          </Box>
          <Box>
            <Typography sx={{ ...lbl, mt: 0 }}>Remark</Typography>
            <TextField
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
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
          form="ticket-part-list-form"
          variant="contained"
          disabled={saveMutation.isPending || !selectedProduct || !ticketId}
          sx={{ textTransform: 'none', minWidth: 100 }}
        >
          {saveMutation.isPending
            ? <CircularProgress size={24} color="inherit" />
            : (mode === 'create' ? 'Add' : 'Update')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function TicketPartsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState([]);
  const [clearSelectionKey, setClearSelectionKey] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingItem, setEditingItem] = useState(null);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  const { data: ticketParts = [] } = useQuery({
    queryKey: ['ticket-parts-list'],
    queryFn: async () => {
      const response = await api.get('/ticket-parts');
      return response.data?.data || response.data || [];
    },
    select: (data) =>
      (data || []).map((row, i) => ({
        ...row,
        id: row.ticketPartId || `fallback-id-${i}`,
      })),
    staleTime: 1000 * 60 * 5,
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map((id) => api.delete(`/ticket-parts/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-parts-list'] });
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey((prev) => prev + 1);
    },
    onError: (error) => {
      console.error('Failed to delete ticket parts:', error);
      alert(error.response?.data?.message || error.message || 'Failed to delete ticket parts');
    },
  });

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingItem(null);
    setOpenModal(true);
  };

  const handleOpenUpdateModal = () => {
    if (selectedIds.length !== 1) return;
    const item = ticketParts.find((p) => String(p.id) === String(selectedIds[0]));
    if (!item) return;
    setModalMode('update');
    setEditingItem(item);
    setOpenModal(true);
  };

  const handleModalClose = (saved) => {
    setOpenModal(false);
    setEditingItem(null);
    if (saved && modalMode === 'update') {
      setSelectedIds([]);
      setClearSelectionKey((prev) => prev + 1);
    }
  };

  const config = useMemo(() => ({
    title: 'Ticket Parts',
    subtitle: `${ticketParts.length} ticket part suggestions`,
    rows: ticketParts,
    columns: [
      { field: 'id', headerName: 'ID', width: 80 },
      {
        field: 'ticketId',
        headerName: 'Ticket',
        width: 100,
        renderType: 'link',
      },
      { field: 'partName', headerName: 'Part Name', width: 160 },
      { field: 'quantity', headerName: 'Qty', width: 70 },
      { field: 'remark', headerName: 'Remark', width: 160 },
      {
        field: 'managerApproval',
        headerName: 'Manager',
        width: 100,
        renderCell: (params) => {
          if (params.value === true) return 'Approved';
          if (params.value === false) return 'Rejected';
          return 'Pending';
        },
      },
      {
        field: 'customerApproval',
        headerName: 'Customer',
        width: 100,
        renderCell: (params) => {
          if (params.value === true) return 'Approved';
          if (params.value === false) return 'Rejected';
          return 'Pending';
        },
      },
      {
        field: 'partStatus',
        headerName: 'Status',
        width: 110,
        renderCell: (params) => params.value || '-',
      },
      { field: 'orderId', headerName: 'Order', width: 90 },
      { field: 'quoteId', headerName: 'Quote', width: 90 },
      { field: 'createdByName', headerName: 'Created By', width: 130 },
      { field: 'updatedByName', headerName: 'Updated By', width: 130 },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search ticket parts...',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 480,
    gridKey: clearSelectionKey,
    onRowClick: (params) => {
      if (params?.row?.ticketId) navigate(`/tickets/${params.row.ticketId}`);
    },
    actions: [
      { label: 'Add Ticket Part', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreateModal },
    ],
  }), [ticketParts, clearSelectionKey, navigate]);

  return (
    <Box sx={{ p: 2, pt: 3 }}>
      <List
        config={config}
        rowSelectionModel={selectedIds}
        onRowSelectionModelChange={setSelectedIds}
      />

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<EditOutlinedIcon />}
          disabled={selectedIds.length !== 1}
          onClick={handleOpenUpdateModal}
        >
          Update
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteOutlinedIcon />}
          disabled={selectedIds.length === 0}
          onClick={() => setOpenDeleteConfirm(true)}
        >
          Delete
        </Button>
      </Box>

      <TicketPartListModal
        open={openModal}
        onClose={handleModalClose}
        mode={modalMode}
        item={editingItem}
      />

      <DeleteConfirmDialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate(selectedIds.map(Number))}
        itemType="ticket part"
        count={selectedIds.length}
        isLoading={deleteMutation.isPending}
      />
    </Box>
  );
}
