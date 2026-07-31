import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  TextField, CircularProgress, Button, Divider, Typography, MenuItem
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { List } from '../../stereotype/AbstractList';
import api from '../../services/api';
import { useTheme } from '@mui/material/styles';

export default function VendorDetailsPage() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // ── Data Fetching ──────────────────────────────────────────────
  const { data: vendorsData = [], isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const res = await api.get('/vendors');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const vendors = useMemo(() =>
    vendorsData.map((v, idx) => ({ ...v, id: v.id || `fallback-${idx}` })),
    [vendorsData]
  );

  // ── State ──────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState([]);
  const [clearSelectionKey, setClearSelectionKey] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  const initialFormState = {
    id: '', name: '', mobileNo: '', email: '', address: '',
    description: '', password: '', isActive: true,
  };
  const [formData, setFormData] = useState(initialFormState);

  // ── Mutations ──────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      if (modalMode === 'create') return api.post('/vendors', payload);
      return api.put(`/vendors/${formData.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setOpenModal(false);
      setFormData(initialFormState);
      if (modalMode === 'update') { setSelectedIds([]); setClearSelectionKey(p => p + 1); }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/vendors/${selectedIds[0]}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey(p => p + 1);
    },
  });

  // ── Handlers ──────────────────────────────────────────────────
  const handleOpenCreate = () => { setModalMode('create'); setFormData(initialFormState); setOpenModal(true); };

  const handleOpenUpdate = () => {
    if (selectedIds.length !== 1) return;
    const v = vendors.find(v => String(v.id) === String(selectedIds[0]));
    if (v) {
      setModalMode('update');
      setFormData({ id: v.id, name: v.name || '', mobileNo: v.mobileNo || '', email: v.email || '', address: v.address || '', description: v.description || '', password: '', isActive: v.isActive !== false });
      setOpenModal(true);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { name: formData.name, mobileNo: formData.mobileNo, email: formData.email, address: formData.address, description: formData.description, isActive: formData.isActive };
    if (formData.password) payload.password = formData.password;
    submitMutation.mutate(payload);
  };

  const lbl = { fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.8, mt: 2 };

  // ── Grid Config ────────────────────────────────────────────────
  const config = useMemo(() => ({
    title: 'Vendor Management',
    subtitle: `${vendors.length} vendors registered`,
    loading: isLoading,
    rows: vendors,
    columns: [
      { field: 'id', headerName: 'ID', width: 70 },
      { field: 'name', headerName: 'Vendor Name', flex: 1.5 },
      { field: 'mobileNo', headerName: 'Mobile', flex: 1 },
      { field: 'email', headerName: 'Email', flex: 1.5 },
      { field: 'address', headerName: 'Address', flex: 1.5 },
      {
        field: 'isActive', headerName: 'Status', width: 100,
        renderCell: (params) => {
          const active = params.value !== false;
          return (
            <Box sx={{ display: 'inline-flex', px: 1, py: 0.2, borderRadius: 1, fontSize: '0.75rem', fontWeight: 600, bgcolor: active ? `${theme.palette.success.main}1A` : `${theme.palette.error.main}1A`, color: active ? 'success.main' : 'error.main' }}>
              {active ? 'Active' : 'Inactive'}
            </Box>
          );
        }
      },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search vendors…',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 520,
    gridKey: clearSelectionKey,
    actions: [
      { label: 'Add Vendor', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreate },
    ],
    onRowClick: (params) => navigate(`/vendors/${params.row.id}`),
  }), [vendors, clearSelectionKey, theme, isLoading, navigate]);

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
          {modalMode === 'create' ? 'Add New Vendor' : 'Update Vendor'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box component="form" id="vendor-form" onSubmit={handleSubmit}>
            <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, mb: 2.5 }}>
              {modalMode === 'create' ? 'Register a new vendor.' : 'Update the selected vendor details.'}
            </Typography>

            <Typography sx={{ ...lbl, mt: 0 }}>Vendor Name *</Typography>
            <TextField fullWidth size="small" placeholder="e.g. Tech Partners Ltd." name="name" value={formData.name} onChange={handleFormChange} required sx={{ mb: 0 }} />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography sx={lbl}>Mobile Number</Typography>
                <TextField fullWidth size="small" placeholder="e.g. 9876543210" name="mobileNo" value={formData.mobileNo} onChange={handleFormChange} />
              </Box>
              <Box>
                <Typography sx={lbl}>Email Address</Typography>
                <TextField fullWidth size="small" placeholder="vendor@example.com" type="email" name="email" value={formData.email} onChange={handleFormChange} />
              </Box>
            </Box>

            <Typography sx={lbl}>Password {modalMode === 'update' && <span style={{ fontWeight: 400, textTransform: 'none' }}>(leave blank to keep)</span>}</Typography>
            <TextField fullWidth size="small" type="password" placeholder={modalMode === 'create' ? 'Enter password' : 'Leave blank to keep current'} name="password" value={formData.password} onChange={handleFormChange} required={modalMode === 'create'} />

            <Typography sx={lbl}>Address</Typography>
            <TextField fullWidth size="small" placeholder="Vendor address" name="address" value={formData.address} onChange={handleFormChange} multiline rows={2} />

            <Typography sx={lbl}>Description / Notes</Typography>
            <TextField fullWidth size="small" placeholder="Optional notes about this vendor" name="description" value={formData.description} onChange={handleFormChange} multiline rows={2} />

            {modalMode === 'update' && (
              <>
                <Typography sx={lbl}>Account Status</Typography>
                <TextField fullWidth size="small" select name="isActive" value={String(formData.isActive)} onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.value === 'true' }))}>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </TextField>
              </>
            )}
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenModal(false)} variant="outlined" disabled={submitMutation.isPending} sx={{ px: 3 }}>Cancel</Button>
          <Button type="submit" form="vendor-form" variant="contained" disabled={submitMutation.isPending} sx={{ px: 3, minWidth: 100 }}>
            {submitMutation.isPending ? <CircularProgress size={24} color="inherit" /> : (modalMode === 'create' ? 'Save Vendor' : 'Update Vendor')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>Confirm Deletion</DialogTitle>
        <Divider />
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this vendor? This action cannot be undone.</DialogContentText>
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
