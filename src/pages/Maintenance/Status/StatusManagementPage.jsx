import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, CircularProgress, Button, Divider, Typography, MenuItem, Switch, FormControlLabel, Checkbox, ListItemText, FormControl, Select } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { List } from '../../../stereotype/AbstractList';
import api from '../../../services/api';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmDialog from '../../../components/DeleteConfirmDialog';

export default function StatusManagementPage() {
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
    statusId: '', statusName: '', statusFlg: 1, statusDescription: '', statusType: '', allowedDepartmentIds: []
  };
  const [formData, setFormData] = useState(initialFormState);

  const { data: rawStatuses = [] } = useQuery({
    queryKey: ['statuses'],
    queryFn: async () => {
      const response = await api.get('/statuses');
      return response.data?.data || response.data || [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return response.data?.data || response.data || [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const statuses = useMemo(() => {
    return rawStatuses.map((s, index) => ({
      ...s,
      id: s.statusId || `fallback-id-${index}`,
    }));
  }, [rawStatuses]);

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
        allowedDepartmentIds: sToUpdate.allowedDepartmentIds ? sToUpdate.allowedDepartmentIds.split(',').filter(v => v.trim() !== '').map(v => Number(v.trim())) : [],
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
    let newValue = value;
    if (type === 'checkbox') {
        newValue = checked ? 1 : 0;
    } else if (name === 'allowedDepartmentIds') {
        // On autofill we get a stringified value.
        newValue = typeof value === 'string' ? value.split(',') : value;
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      if (modalMode === 'create') {
        return api.post('/statuses', payload);
      } else {
        return api.put(`/statuses/${formData.statusId}`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statuses'] });
      if (modalMode !== 'create') {
        setSelectedIds([]);
        setClearSelectionKey(prev => prev + 1);
      }
      handleCloseModal();
    },
    onError: (error) => {
      console.error(`Failed to ${modalMode} status:`, error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (sId) => api.delete(`/statuses/${sId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statuses'] });
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey(prev => prev + 1);
    },
    onError: (error) => {
      console.error('Failed to delete status:', error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate({
      statusName: formData.statusName,
      statusFlg: formData.statusFlg,
      statusDescription: formData.statusDescription,
      statusType: formData.statusType,
      allowedDepartmentIds: formData.allowedDepartmentIds.length > 0 ? formData.allowedDepartmentIds.join(',') : null,
    });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(selectedIds[0]);
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
      { field: 'allowedRoles', headerName: 'Allowed Roles', flex: 1 },
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
      { field: 'insertDate', headerName: 'Created At', width: 130, type: 'date', valueGetter: (params) => params.value ? new Date(params.value) : null },
      { field: 'lastUpdateDate', headerName: 'Updated At', width: 130, type: 'date', valueGetter: (params) => params.value ? new Date(params.value) : null },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search statuses…',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 480,
    gridKey: clearSelectionKey,
    getRowClassName: (params) => params.row?.isLocked ? 'locked-row' : '',
    actions: [
      { label: 'Add Status', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreateModal },
    ],
  }), [statuses, clearSelectionKey, theme]);

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.8, mt: 2,
  };
  const selectedRowsAreLocked = selectedIds.some(id => {
    const row = statuses.find(b => String(b.id) === String(id));
    return row?.isLocked;
  });

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
          disabled={selectedIds.length !== 1 || selectedRowsAreLocked}
          onClick={handleOpenUpdateModal}
        >
          Update
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteOutlinedIcon />}
          disabled={selectedIds.length === 0 || selectedRowsAreLocked}
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
            
            <Typography sx={{ ...lbl, mt: 1 }}>Allowed Departments (Optional)</Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <Select
                multiple
                displayEmpty
                name="allowedDepartmentIds"
                value={formData.allowedDepartmentIds || []}
                onChange={handleFormChange}
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return <Typography color="text.secondary">None (Available to all)</Typography>;
                  }
                  return selected.map(id => {
                    const dept = departments.find(d => d.departmentId === id);
                    return dept ? dept.departmentName : id;
                  }).join(', ');
                }}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.departmentId} value={dept.departmentId}>
                    <Checkbox checked={(formData.allowedDepartmentIds || []).indexOf(dept.departmentId) > -1} />
                    <ListItemText primary={dept.departmentName} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
          <Button onClick={handleCloseModal} variant="outlined" disabled={submitMutation.isPending} sx={{ px: 3 }}>Cancel</Button>
          <Button type="submit" form="status-form" variant="contained" disabled={submitMutation.isPending} sx={{ px: 3, minWidth: 100 }}>
            {submitMutation.isPending ? <CircularProgress size={24} color="inherit" /> : (modalMode === 'create' ? 'Save Status' : 'Update Status')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <DeleteConfirmDialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        itemType="status"
        itemTypePlural="statuses"
        count={selectedIds.length}
        isLoading={deleteMutation.isPending}
      />
    </Box>
  );
}
