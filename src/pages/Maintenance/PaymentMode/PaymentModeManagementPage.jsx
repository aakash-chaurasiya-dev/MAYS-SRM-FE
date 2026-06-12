import { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, CircularProgress, Button, Divider, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { List } from '../../../stereotype/AbstractList';
import api from '../../../services/api';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

export default function PaymentModeManagementPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [paymentModes, setPaymentModes] = useState([]);
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [clearSelectionKey, setClearSelectionKey] = useState(0);

  // Modal & Form State
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'update'
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Delete Confirmation State
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const initialFormState = {
    payModeId: '', paymentMode: '', description: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchPaymentModes = useCallback(async () => {
    try {
      const response = await api.get('/payment-modes');
      const data = response.data?.data || response.data || [];
      setPaymentModes(data.map((pm, index) => ({
        ...pm,
        id: pm.payModeId || `fallback-id-${index}`,
      })));
    } catch (error) {
      console.error('Failed to fetch payment modes:', error);
    }
  }, []);

  useEffect(() => {
    fetchPaymentModes();
  }, [fetchPaymentModes]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData(initialFormState);
    setOpenModal(true);
  };

  const handleOpenUpdateModal = () => {
    if (selectedIds.length !== 1) return;
    const pmToUpdate = paymentModes.find(pm => String(pm.id) === String(selectedIds[0]));
    if (pmToUpdate) {
      setModalMode('update');
      setFormData({
        payModeId: pmToUpdate.payModeId || '',
        paymentMode: pmToUpdate.paymentMode || '',
        description: pmToUpdate.description || '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const payload = {
        paymentMode: formData.paymentMode,
        description: formData.description,
      };

      if (modalMode === 'create') {
        await api.post('/payment-modes', payload);
      } else {
        await api.put(`/payment-modes/${formData.payModeId}`, payload);
        setSelectedIds([]); 
        setClearSelectionKey(prev => prev + 1);
      }
      handleCloseModal();
      fetchPaymentModes();
    } catch (error) {
      console.error(`Failed to ${modalMode} payment mode:`, error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      const pmId = selectedIds[0];
      await api.delete(`/payment-modes/${pmId}`);
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey(prev => prev + 1);
      fetchPaymentModes();
    } catch (error) {
      console.error('Failed to delete payment mode:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const config = useMemo(() => ({
    title: 'Payment Mode Management',
    subtitle: `${paymentModes.length} payment modes configured`,
    rows: paymentModes,
    columns: [
      { field: 'id', headerName: 'ID', width: 90 },
      { field: 'paymentMode', headerName: 'Payment Mode', flex: 1.2, renderType: 'link' },
      { field: 'description', headerName: 'Description', flex: 2 },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search payment modes…',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 480,
    gridKey: clearSelectionKey,
    actions: [
      { label: 'Add Payment Mode', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreateModal },
    ],
  }), [paymentModes, clearSelectionKey]);

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.8, mt: 2,
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Breadcrumb / Back */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/maintenance')}
          sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
          Maintenance
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
          Payment Mode Management
        </Typography>
        <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
          Manage available payment modes for customer billing and invoices
        </Typography>
      </Box>

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
          {modalMode === 'create' ? 'Add New Payment Mode' : 'Update Payment Mode'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box component="form" id="paymentmode-form" onSubmit={handleSubmit}>
            <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, mb: 2.5 }}>
              {modalMode === 'create' ? 'Register a new payment method to the system.' : 'Update the details of the selected payment mode.'}
            </Typography>

            <Typography sx={{ ...lbl, mt: 0 }}>Payment Mode Name</Typography>
            <TextField
              fullWidth size="small" placeholder="e.g. Credit Card, Cash, UPI"
              name="paymentMode" value={formData.paymentMode} onChange={handleFormChange} required
              sx={{ mb: 2 }}
            />

            <Typography sx={lbl}>Description</Typography>
            <TextField
              fullWidth size="small" placeholder="Enter description"
              name="description" value={formData.description} onChange={handleFormChange} required
              multiline rows={3}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} variant="outlined" disabled={submitLoading} sx={{ px: 3 }}>Cancel</Button>
          <Button type="submit" form="paymentmode-form" variant="contained" disabled={submitLoading} sx={{ px: 3, minWidth: 100 }}>
            {submitLoading ? <CircularProgress size={24} color="inherit" /> : (modalMode === 'create' ? 'Save Mode' : 'Update Mode')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>Confirm Deletion</DialogTitle>
        <Divider />
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedIds.length === 1 ? 'this payment mode' : `these ${selectedIds.length} payment modes`}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteConfirm(false)} color="inherit" disabled={deleteLoading}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteLoading} sx={{ minWidth: 90 }}>
             {deleteLoading ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
