import { useState, useMemo } from 'react';
import {
  Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  TextField, CircularProgress, Button, Divider, Typography, MenuItem
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { List } from '../../stereotype/AbstractList';
import api from '../../services/api';
import { useTheme } from '@mui/material/styles';

export default function VendorUsersTab({ vendorId, vendorUsers = [], loading = false }) {
  const theme = useTheme();
  const queryClient = useQueryClient();

  // ── State ──────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState([]);
  const [clearSelectionKey, setClearSelectionKey] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  const initialFormState = {
    id: '',
    user: '',
    contactNo: '',
    isActive: true,
  };
  const [formData, setFormData] = useState(initialFormState);

  // ── Mutations ──────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      if (modalMode === 'create') {
        return api.post('/vendor-users', { ...payload, vendorId: Number(vendorId) });
      }
      return api.put(`/vendor-users/${formData.id}`, { ...payload, vendorId: Number(vendorId) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorUsers', String(vendorId)] });
      queryClient.invalidateQueries({ queryKey: ['vendorUsers', Number(vendorId)] });
      setOpenModal(false);
      setFormData(initialFormState);
      if (modalMode === 'update') {
        setSelectedIds([]);
        setClearSelectionKey(p => p + 1);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(selectedIds.map(id => api.delete(`/vendor-users/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorUsers', String(vendorId)] });
      queryClient.invalidateQueries({ queryKey: ['vendorUsers', Number(vendorId)] });
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey(p => p + 1);
    },
  });

  // ── Handlers ──────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData(initialFormState);
    setOpenModal(true);
  };

  const handleOpenUpdate = () => {
    if (selectedIds.length !== 1) return;
    const vu = vendorUsers.find(v => String(v.id) === String(selectedIds[0]));
    if (vu) {
      setModalMode('update');
      setFormData({
        id: vu.id,
        user: vu.user || '',
        contactNo: vu.contactNo || '',
        isActive: vu.isActive !== false
      });
      setOpenModal(true);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      user: formData.user,
      contactNo: formData.contactNo,
      isActive: formData.isActive
    };
    submitMutation.mutate(payload);
  };

  const lbl = { fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.8, mt: 2 };

  // ── Grid Config ────────────────────────────────────────────────
  const config = useMemo(() => ({
    title: 'Vendor Users',
    subtitle: `${vendorUsers.length} users registered`,
    loading: loading || submitMutation.isPending || deleteMutation.isPending,
    rows: vendorUsers,
    columns: [
      { field: 'id', headerName: 'ID', width: 70 },
      { field: 'user', headerName: 'User Name', flex: 1.5 },
      { field: 'contactNo', headerName: 'Contact No', flex: 1.5 },
      {
        field: 'isActive', headerName: 'Status', width: 120,
        renderCell: (params) => {
          const active = params.value !== false;
          return (
            <Box sx={{
              display: 'inline-flex', px: 1, py: 0.2, borderRadius: 1,
              fontSize: '0.75rem', fontWeight: 600,
              bgcolor: active ? `${theme.palette.success.main}1A` : `${theme.palette.error.main}1A`,
              color: active ? 'success.main' : 'error.main'
            }}>
              {active ? 'Active' : 'Inactive'}
            </Box>
          );
        }
      },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search vendor users…',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 380,
    gridKey: clearSelectionKey,
    actions: [
      { label: 'Add Vendor User', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreate },
    ],
  }), [vendorUsers, clearSelectionKey, theme, loading, submitMutation.isPending, deleteMutation.isPending]);

  return (
    <Box>
      <List config={config} rowSelectionModel={selectedIds} onRowSelectionModelChange={setSelectedIds} />

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button variant="outlined" color="primary" startIcon={<EditOutlinedIcon />} disabled={selectedIds.length !== 1} onClick={handleOpenUpdate}>Update</Button>
        <Button variant="outlined" color="error" startIcon={<DeleteOutlinedIcon />} disabled={selectedIds.length === 0} onClick={() => setOpenDeleteConfirm(true)}>Delete</Button>
      </Box>

      {/* ── Create / Update Modal ── */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '4px', border: `1px solid ${theme.palette.divider}` } }}>
        <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, py: 2, px: 3 }}>
          {modalMode === 'create' ? 'Add Vendor User' : 'Update Vendor User'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box component="form" id="vendor-user-form" onSubmit={handleSubmit}>
            <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, mb: 2.5 }}>
              {modalMode === 'create' ? 'Register a new user for this vendor.' : 'Update the selected vendor user details.'}
            </Typography>

            <Typography sx={{ ...lbl, mt: 0 }}>User Name *</Typography>
            <TextField fullWidth size="small" placeholder="e.g. John Doe" name="user" value={formData.user} onChange={handleFormChange} required />

            <Typography sx={{ ...lbl }}>Contact Number</Typography>
            <TextField fullWidth size="small" placeholder="e.g. 9876543210" name="contactNo" value={formData.contactNo} onChange={handleFormChange} />

            <Typography sx={lbl}>Account Status</Typography>
            <TextField fullWidth size="small" select name="isActive" value={String(formData.isActive)} onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.value === 'true' }))}>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenModal(false)} variant="outlined" disabled={submitMutation.isPending} sx={{ px: 3 }}>Cancel</Button>
          <Button type="submit" form="vendor-user-form" variant="contained" disabled={submitMutation.isPending} sx={{ px: 3, minWidth: 100 }}>
            {submitMutation.isPending ? <CircularProgress size={24} color="inherit" /> : (modalMode === 'create' ? 'Save User' : 'Update User')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>Confirm Deletion</DialogTitle>
        <Divider />
        <DialogContent>
          <DialogContentText>Are you sure you want to delete the selected vendor user(s)? This action cannot be undone.</DialogContentText>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteConfirm(false)} color="inherit" disabled={deleteMutation.isPending}>Cancel</Button>
          <Button onClick={() => deleteMutation.mutate()} color="error" variant="contained" disabled={deleteMutation.isPending} sx={{ minWidth: 90 }}>
            {deleteMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
