import { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, CircularProgress, Button, Divider, Typography, MenuItem, Switch, FormControlLabel } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { List } from '../../../stereotype/AbstractList';
import api from '../../../services/api';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

export default function StatusManagementPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [statuses, setStatuses] = useState([]);
  
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
    statusId: '', statusName: '', statusFlg: 1, statusDescription: '', statusType: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchStatuses = useCallback(async () => {
    try {
      const response = await api.get('/statuses');
      const data = response.data?.data || response.data || [];
      setStatuses(data.map((s, index) => ({
        ...s,
        id: s.statusId || `fallback-id-${index}`,
      })));
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData(initialFormState);
    setOpenModal(true);
  };

  const handleOpenUpdateModal = () => {
    if (selectedIds.length !== 1) return;
    const sToUpdate = statuses.find(s => String(s.id) === String(selectedIds[0]));
    if (sToUpdate) {
      setModalMode('update');
      setFormData({
        statusId: sToUpdate.statusId || '',
        statusName: sToUpdate.statusName || '',
        statusFlg: sToUpdate.statusFlg !== undefined ? sToUpdate.statusFlg : 1,
        statusDescription: sToUpdate.statusDescription || '',
        statusType: sToUpdate.statusType || '',
      });
      setOpenModal(true);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setFormData(initialFormState);
  };

  const handleFormChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const payload = {
        statusName: formData.statusName,
        statusFlg: formData.statusFlg,
        statusDescription: formData.statusDescription,
        statusType: formData.statusType,
      };

      if (modalMode === 'create') {
        await api.post('/statuses', payload);
      } else {
        await api.put(`/statuses/${formData.statusId}`, payload);
        setSelectedIds([]); 
        setClearSelectionKey(prev => prev + 1);
      }
      handleCloseModal();
      fetchStatuses();
    } catch (error) {
      console.error(`Failed to ${modalMode} status:`, error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      const sId = selectedIds[0];
      await api.delete(`/statuses/${sId}`);
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey(prev => prev + 1);
      fetchStatuses();
    } catch (error) {
      console.error('Failed to delete status:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const config = useMemo(() => ({
    title: 'Status Management',
    subtitle: `${statuses.length} status codes configured`,
    rows: statuses,
    columns: [
      { field: 'id', headerName: 'Status ID', width: 110 },
      { field: 'statusName', headerName: 'Status Name', flex: 1.5, renderType: 'link' },
      { field: 'statusType', headerName: 'Type', flex: 1 },
      { field: 'statusDescription', headerName: 'Description', flex: 2 },
      { 
        field: 'statusFlg', 
        headerName: 'Status', 
        width: 120,
        renderType: 'chip',
        chipColorMap: { '1': 'success', '0': 'error' },
        renderCell: (params) => {
          // List.jsx's builtin chip renderer expects params.value to map exactly, but it might be an integer 1 or 0
          // If we override the render, we can use Chip directly, or map the string.
          // Since builtIn chip maps the exact value, let's map it before passing.
          const isAct = params.value === 1 || params.value === '1';
          return <Box sx={{ display: 'inline-flex', px: 1, py: 0.2, borderRadius: 1, fontSize: '0.75rem', fontWeight: 600, bgcolor: isAct ? `${theme.palette.success.main}1A` : `${theme.palette.error.main}1A`, color: isAct ? 'success.main' : 'error.main' }}>
            {isAct ? 'Active' : 'Inactive'}
          </Box>;
        }
      },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search statuses…',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 480,
    gridKey: clearSelectionKey,
    actions: [
      { label: 'Add Status', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreateModal },
    ],
  }), [statuses, clearSelectionKey, theme]);

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
          Status Management
        </Typography>
        <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
          Define ticket lifecycles and application states.
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
          {modalMode === 'create' ? 'Add New Status' : 'Update Status'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box component="form" id="status-form" onSubmit={handleSubmit}>
            <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, mb: 2.5 }}>
              {modalMode === 'create' ? 'Register a new status state.' : 'Update the details of the selected status.'}
            </Typography>

            <Typography sx={{ ...lbl, mt: 0 }}>Status Name</Typography>
            <TextField
              fullWidth size="small" placeholder="e.g. In Progress, Completed"
              name="statusName" value={formData.statusName} onChange={handleFormChange} required
              sx={{ mb: 2 }}
            />

            <Typography sx={{ ...lbl, mt: 1 }}>Status Type</Typography>
            <TextField
              fullWidth size="small" placeholder="e.g. Ticket, Repair, System"
              name="statusType" value={formData.statusType} onChange={handleFormChange} required
              sx={{ mb: 2 }}
            />

            <Typography sx={{ ...lbl, mt: 1 }}>Description</Typography>
            <TextField
              fullWidth size="small" placeholder="Enter description"
              name="statusDescription" value={formData.statusDescription} onChange={handleFormChange} required
              multiline rows={2}
              sx={{ mb: 2 }}
            />

            <Typography sx={{ ...lbl, mt: 1 }}>Active Status</Typography>
            <FormControlLabel
              control={
                <Switch 
                  checked={formData.statusFlg === 1} 
                  onChange={handleFormChange} 
                  name="statusFlg" 
                  color="primary"
                />
              }
              label={formData.statusFlg === 1 ? "Active" : "Inactive"}
              sx={{ mb: 1, ml: 0 }}
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} variant="outlined" disabled={submitLoading} sx={{ px: 3 }}>Cancel</Button>
          <Button type="submit" form="status-form" variant="contained" disabled={submitLoading} sx={{ px: 3, minWidth: 100 }}>
            {submitLoading ? <CircularProgress size={24} color="inherit" /> : (modalMode === 'create' ? 'Save Status' : 'Update Status')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>Confirm Deletion</DialogTitle>
        <Divider />
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedIds.length === 1 ? 'this status' : `these ${selectedIds.length} statuses`}? This action cannot be undone.
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
