import { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, CircularProgress, Button, Divider, Typography, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { List } from '../../stereotype/AbstractList';
import api from '../../services/api';
import { useTheme } from '@mui/material/styles';

export default function UserDetailsPage() {
  const theme = useTheme();

  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  
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
    userId: '', mobileNo: '', firstName: '', lastName: '', emailId: '', password: '', address: '', branchId: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users');
      const data = response.data?.data || response.data || [];
      setUsers(data.map((u, index) => ({
        ...u,
        id: u.userId || `fallback-id-${index}`,
      })));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    try {
      const response = await api.get('/branches');
      const data = response.data?.data || response.data || [];
      setBranches(data);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, [fetchUsers, fetchBranches]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData(initialFormState);
    setOpenModal(true);
  };

  const handleOpenUpdateModal = () => {
    if (selectedIds.length !== 1) return;
    const uToUpdate = users.find(u => String(u.id) === String(selectedIds[0]));
    if (uToUpdate) {
      setModalMode('update');
      
      let matchedBranchId = '';
      if (uToUpdate.branchName && branches.length > 0) {
        const match = branches.find(b => 
          b.branchName === uToUpdate.branchName || 
          b.name === uToUpdate.branchName
        );
        if (match) {
          matchedBranchId = match.branchId || match.id || '';
        }
      }

      setFormData({
        userId: uToUpdate.userId || '',
        mobileNo: uToUpdate.mobileNo || '',
        firstName: uToUpdate.firstName || '',
        lastName: uToUpdate.lastName || '',
        emailId: uToUpdate.emailId || '',
        password: '', // Usually we do not pre-fill passwords
        address: uToUpdate.address || '',
        branchId: uToUpdate.branchId || matchedBranchId,
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
        mobileNo: formData.mobileNo,
        firstName: formData.firstName,
        lastName: formData.lastName,
        emailId: formData.emailId,
        address: formData.address,
        branchId: formData.branchId,
      };

      // Only include password if it's provided (useful for updates where blank means no change)
      if (formData.password) {
        payload.password = formData.password;
      }

      if (modalMode === 'create') {
        await api.post('/users', payload);
      } else {
        await api.put(`/users/${formData.userId}`, payload);
        setSelectedIds([]); 
        setClearSelectionKey(prev => prev + 1);
      }
      handleCloseModal();
      fetchUsers();
    } catch (error) {
      console.error(`Failed to ${modalMode} user:`, error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      const uId = selectedIds[0];
      await api.delete(`/users/${uId}`);
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey(prev => prev + 1);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const config = useMemo(() => ({
    title: 'User Details',
    subtitle: `${users.length} users registered`,
    rows: users,
    columns: [
      { field: 'id', headerName: 'ID', width: 70 },
      { 
        field: 'fullName', 
        headerName: 'Full Name', 
        flex: 1.5, 
        renderType: 'link',
        valueGetter: (params, row) => `${row.firstName || ''} ${row.lastName || ''}`.trim()
      },
      { field: 'mobileNo', headerName: 'Mobile', flex: 1 },
      { field: 'emailId', headerName: 'Email', flex: 1.5 },
      { field: 'branchName', headerName: 'Branch', flex: 1 },
      { field: 'address', headerName: 'Address', flex: 1.5 },
      { 
        field: 'isActive', 
        headerName: 'Status', 
        width: 100,
        renderType: 'chip',
        chipColorMap: { true: 'success', false: 'error' },
        renderCell: (params) => {
          const isAct = params.value === true || params.value === 'true' || params.value === 1;
          return <Box sx={{ display: 'inline-flex', px: 1, py: 0.2, borderRadius: 1, fontSize: '0.75rem', fontWeight: 600, bgcolor: isAct ? `${theme.palette.success.main}1A` : `${theme.palette.error.main}1A`, color: isAct ? 'success.main' : 'error.main' }}>
            {isAct ? 'Active' : 'Inactive'}
          </Box>;
        }
      },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search users…',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 520,
    gridKey: clearSelectionKey,
    actions: [
      { label: 'Add User', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreateModal },
    ],
  }), [users, clearSelectionKey, theme]);

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.8, mt: 2,
  };

  return (
    <Box sx={{ p: 2, pt: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.01em', color: theme.palette.text.primary }}>
          User Details
        </Typography>
        <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
          Manage user accounts, roles, and branch assignments.
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
          {modalMode === 'create' ? 'Add New User' : 'Update User Details'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box component="form" id="user-form" onSubmit={handleSubmit}>
            <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, mb: 2.5 }}>
              {modalMode === 'create' ? 'Register a new user account.' : 'Update the details of the selected user.'}
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography sx={{ ...lbl, mt: 0 }}>First Name</Typography>
                <TextField
                  fullWidth size="small" placeholder="John"
                  name="firstName" value={formData.firstName} onChange={handleFormChange} required
                />
              </Box>
              <Box>
                <Typography sx={{ ...lbl, mt: 0 }}>Last Name</Typography>
                <TextField
                  fullWidth size="small" placeholder="Doe"
                  name="lastName" value={formData.lastName} onChange={handleFormChange} required
                />
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography sx={lbl}>Mobile Number</Typography>
                <TextField
                  fullWidth size="small" placeholder="e.g. 1234567890"
                  name="mobileNo" value={formData.mobileNo} onChange={handleFormChange} required
                />
              </Box>
              <Box>
                <Typography sx={lbl}>Email Address</Typography>
                <TextField
                  fullWidth size="small" placeholder="user@example.com" type="email"
                  name="emailId" value={formData.emailId} onChange={handleFormChange} required
                />
              </Box>
            </Box>

            <Typography sx={lbl}>Password</Typography>
            <TextField
              fullWidth size="small" placeholder={modalMode === 'create' ? "Enter password" : "Leave blank to keep current password"}
              type="password"
              name="password" value={formData.password} onChange={handleFormChange} required={modalMode === 'create'}
              sx={{ mb: 2 }}
            />

            <Typography sx={{ ...lbl, mt: 0 }}>Branch Assignment</Typography>
            <TextField
              fullWidth size="small" select
              name="branchId" value={formData.branchId} onChange={handleFormChange} required
              sx={{ mb: 2 }}
            >
              <MenuItem value="" disabled>Select a branch…</MenuItem>
              {branches.map((b) => (
                <MenuItem key={b.branchId || b.id} value={b.branchId || b.id}>
                  {b.branchName || b.name}
                </MenuItem>
              ))}
              {branches.length === 0 && (
                 <MenuItem value={formData.branchId} sx={{ display: formData.branchId ? 'block' : 'none' }}>
                   {formData.branchId} (Current)
                 </MenuItem>
              )}
            </TextField>

            <Typography sx={{ ...lbl, mt: 0 }}>Address</Typography>
            <TextField
              fullWidth size="small" placeholder="Enter full address"
              name="address" value={formData.address} onChange={handleFormChange}
              multiline rows={2}
            />

          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} variant="outlined" disabled={submitLoading} sx={{ px: 3 }}>Cancel</Button>
          <Button type="submit" form="user-form" variant="contained" disabled={submitLoading} sx={{ px: 3, minWidth: 100 }}>
            {submitLoading ? <CircularProgress size={24} color="inherit" /> : (modalMode === 'create' ? 'Save User' : 'Update User')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>Confirm Deletion</DialogTitle>
        <Divider />
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedIds.length === 1 ? 'this user' : `these ${selectedIds.length} users`}? This action cannot be undone.
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
