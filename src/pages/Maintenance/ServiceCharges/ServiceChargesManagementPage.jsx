import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, CircularProgress, Button, Divider, Typography, MenuItem, InputAdornment } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { List } from '../../../stereotype/AbstractList';
import api from '../../../services/api';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmDialog from '../../../components/DeleteConfirmDialog';

export default function ServiceChargesManagementPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [clearSelectionKey, setClearSelectionKey] = useState(0);

  // Modal & Form State
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'update'
  
  // Delete Confirmation State
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  const initialFormState = {
    chargeId: '', brandId: '', descr: '', amount: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const { data: rawServiceCharges = [] } = useQuery({
    queryKey: ['serviceCharges'],
    queryFn: async () => {
      const response = await api.get('/service-charges');
      return response.data?.data || response.data || [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const { data: rawBrands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await api.get('/brands');
      return response.data?.data || response.data || [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const serviceCharges = useMemo(() => {
    return rawServiceCharges.map((charge, index) => ({
      ...charge,
      id: charge.chargeId || `fallback-id-${index}`,
    }));
  }, [rawServiceCharges]);

  const brands = useMemo(() => {
    return rawBrands.map((brand, index) => ({
      ...brand,
      id: brand.brandId || `fallback-id-${index}`,
    }));
  }, [rawBrands]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData(initialFormState);
    setOpenModal(true);
  };

  const handleOpenUpdateModal = () => {
    if (selectedIds.length !== 1) return;
    const chargeToUpdate = serviceCharges.find(c => String(c.id) === String(selectedIds[0]));
    if (chargeToUpdate) {
      setModalMode('update');
      
      // Try to match brandId from brandName if possible
      let matchedBrandId = '';
      if (chargeToUpdate.brandName && brands.length > 0) {
        const match = brands.find(b => 
          b.brandName === chargeToUpdate.brandName || 
          b.name === chargeToUpdate.brandName
        );
        if (match) {
          matchedBrandId = match.brandId || match.id || '';
        }
      }

      const existingBrandId = chargeToUpdate.brandId || matchedBrandId;

      setFormData({
        chargeId: chargeToUpdate.chargeId || '',
        brandId: existingBrandId,
        descr: chargeToUpdate.descr || '',
        amount: chargeToUpdate.amount !== undefined ? chargeToUpdate.amount : '',
      });
      setOpenModal(true);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setFormData(initialFormState);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      if (modalMode === 'create') {
        return api.post('/service-charges', payload);
      } else {
        return api.put(`/service-charges/${formData.chargeId}`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCharges'] });
      if (modalMode !== 'create') {
        setSelectedIds([]); 
        setClearSelectionKey(prev => prev + 1);
      }
      handleCloseModal();
    },
    onError: (error) => {
      console.error(`Failed to ${modalMode} service charge:`, error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (chargeId) => api.delete(`/service-charges/${chargeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceCharges'] });
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey(prev => prev + 1);
    },
    onError: (error) => {
      console.error('Failed to delete service charge:', error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate({
      brandId: formData.brandId,
      descr: formData.descr,
      amount: parseFloat(formData.amount),
    });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(selectedIds[0]);
  };

  const config = useMemo(() => ({
    title: 'Service Charges Management',
    subtitle: `${serviceCharges.length} service charges configured`,
    rows: serviceCharges,
    columns: [
      { field: 'id', headerName: 'Charge ID', width: 110 },
      { field: 'brandName', headerName: 'Brand Name', width: 200, renderType: 'link' },
      { field: 'descr', headerName: 'Description', flex: 1 },
      { 
        field: 'amount', 
        headerName: 'Amount', 
        width: 150,
        renderCell: (params) => {
          const value = params.value;
          if (value === null || value === undefined) return '';
          return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
        }
      },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search service charges…',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 480,
    gridKey: clearSelectionKey,
    actions: [
      { label: 'Add Service Charge', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreateModal },
    ],
  }), [serviceCharges, clearSelectionKey]);

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.8, mt: 2,
  };

  return (
    <Box sx={{ p: 2 }}>
      <List 
        config={config} 
        rowSelectionModel={selectedIds}
        onRowSelectionModelChange={setSelectedIds}
      />

      {/* Action Buttons for Update and Delete */}
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

      {/* ── Modal (Create/Update) ── */}
      <Dialog 
        open={openModal} 
        onClose={handleCloseModal} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '4px',
            border: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, py: 2, px: 3 }}>
          {modalMode === 'create' ? 'Add New Service Charge' : 'Update Service Charge'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box component="form" id="servicecharge-form" onSubmit={handleSubmit}>
            <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, mb: 2.5 }}>
              {modalMode === 'create' ? 'Register a new service charge.' : 'Update the details of the selected service charge.'}
            </Typography>

            <Typography sx={{ ...lbl, mt: 0 }}>Brand</Typography>
            <TextField
              fullWidth size="small" select
              name="brandId" value={formData.brandId} onChange={handleFormChange} required
              sx={{ mb: 2 }}
            >
              <MenuItem value="" disabled>Select brand…</MenuItem>
              {brands.map((b) => (
                <MenuItem key={b.brandId || b.id} value={b.brandId || b.id}>
                  {b.brandName || b.name}
                </MenuItem>
              ))}
              {brands.length === 0 && (
                 <MenuItem value={formData.brandId} sx={{ display: formData.brandId ? 'block' : 'none' }}>
                   {formData.brandId} (Current)
                 </MenuItem>
              )}
            </TextField>

            <Typography sx={{ ...lbl, mt: 1 }}>Description</Typography>
            <TextField
              fullWidth size="small" placeholder="e.g. Screen Replacement Labor"
              name="descr" value={formData.descr} onChange={handleFormChange} required
              sx={{ mb: 2 }}
            />

            <Typography sx={{ ...lbl, mt: 1 }}>Amount</Typography>
            <TextField
              fullWidth size="small" placeholder="0.00" type="number" inputProps={{ step: "0.01", min: "0" }}
              name="amount" value={formData.amount} onChange={handleFormChange} required
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                },
              }}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} variant="outlined" disabled={submitMutation.isPending} sx={{ px: 3 }}>Cancel</Button>
          <Button type="submit" form="servicecharge-form" variant="contained" disabled={submitMutation.isPending} sx={{ px: 3, minWidth: 100 }}>
            {submitMutation.isPending ? <CircularProgress size={24} color="inherit" /> : (modalMode === 'create' ? 'Save Charge' : 'Update Charge')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <DeleteConfirmDialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        itemType="service charge"
        count={selectedIds.length}
        isLoading={deleteMutation.isPending}
      />
    </Box>
  );
}
