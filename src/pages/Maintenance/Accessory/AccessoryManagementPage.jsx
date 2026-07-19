import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, CircularProgress, Button, Divider, Typography, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { List } from '../../../stereotype/AbstractList';
import api from '../../../services/api';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

export default function AccessoryManagementPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState([]);
  const [clearSelectionKey, setClearSelectionKey] = useState(0);

  // Modal & Form State
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  
  // Delete Confirmation State
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();

  const initialFormState = {
    accessoryId: '', accessoryName: '', description: '', deviceTypeId: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  const { data: rawAccessories = [], isLoading: accessoriesLoading } = useQuery({
    queryKey: ['accessories'],
    queryFn: async () => {
      const response = await api.get('/device-accessories');
      return response.data?.data || response.data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const { data: rawDeviceTypes = [] } = useQuery({
    queryKey: ['deviceTypes'],
    queryFn: async () => {
      const response = await api.get('/devicetypes');
      return response.data?.data || response.data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const accessories = useMemo(() => {
    return rawAccessories.map((acc, index) => ({
      ...acc,
      id: acc.accessoryId || `fallback-id-${index}`,
    }));
  }, [rawAccessories]);

  const deviceTypes = useMemo(() => {
    return rawDeviceTypes.map((type, index) => ({
      ...type,
      id: type.deviceTypeId || `fallback-id-${index}`,
    }));
  }, [rawDeviceTypes]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData(initialFormState);
    setOpenModal(true);
  };

  const handleOpenUpdateModal = () => {
    if (selectedIds.length !== 1) return;
    const itemToUpdate = accessories.find(a => String(a.id) === String(selectedIds[0]));
    if (itemToUpdate) {
      setModalMode('update');
      setFormData({
        accessoryId: itemToUpdate.accessoryId || '',
        accessoryName: itemToUpdate.accessoryName || '',
        description: itemToUpdate.description || '',
        deviceTypeId: itemToUpdate.deviceTypeId || '',
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
        return api.post('/device-accessories', payload);
      } else {
        return api.put(`/device-accessories/${formData.accessoryId}`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessories'] });
      if (modalMode !== 'create') {
        setSelectedIds([]); 
        setClearSelectionKey(prev => prev + 1);
      }
      handleCloseModal();
    },
    onError: (error) => {
      console.error(`Failed to ${modalMode} accessory:`, error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/device-accessories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessories'] });
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey(prev => prev + 1);
    },
    onError: (error) => {
      console.error('Failed to delete accessory:', error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate({
      accessoryName: formData.accessoryName,
      description: formData.description,
      deviceTypeId: formData.deviceTypeId,
    });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(selectedIds[0]);
  };

  const config = useMemo(() => ({
    title: 'Accessory Management',
    subtitle: `${accessories.length} accessories configured`,
    rows: accessories,
    columns: [

      { field: 'id', headerName: 'Accessory ID', width: 140 },
      { field: 'accessoryName', headerName: 'Name', flex: 1.5, renderType: 'link' },
      { field: 'deviceTypeName', headerName: 'Device Type', flex: 1.5 },
      { field: 'description', headerName: 'Description', flex: 2 },
      { 
        field: 'insertDate', 
        headerName: 'Created At', 
        width: 160,
        valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : '' 
      },
      { 
        field: 'lastUpdateDate', 
        headerName: 'Updated At', 
        width: 160,
        valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : '' 
      },
      { field: 'insertDate', headerName: 'Created At', width: 130, type: 'date', valueGetter: (params) => params.value ? new Date(params.value) : null },
      { field: 'lastUpdateDate', headerName: 'Updated At', width: 130, type: 'date', valueGetter: (params) => params.value ? new Date(params.value) : null },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search accessories…',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 480,
    gridKey: clearSelectionKey,
    getRowClassName: (params) => params.row?.isLocked ? 'locked-row' : '',
    actions: [
      { label: 'Add Accessory', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreateModal },
    ],
  }), [accessories, clearSelectionKey]);

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.8, mt: 2,
  };
  const selectedRowsAreLocked = selectedIds.some(id => {
    const row = accessories.find(b => String(b.id) === String(id));
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
          {modalMode === 'create' ? 'Add New Accessory' : 'Update Accessory'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box component="form" id="accessory-form" onSubmit={handleSubmit}>
            <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, mb: 2.5 }}>
              {modalMode === 'create' ? 'Register a new accessory mapped to a specific device type.' : 'Update the details of the selected accessory.'}
            </Typography>

            <Typography sx={{ ...lbl, mt: 0 }}>Accessory Name</Typography>
            <TextField
              fullWidth size="small" placeholder="e.g. 65W Charger"
              name="accessoryName" value={formData.accessoryName} onChange={handleFormChange} required
              sx={{ mb: 2 }}
            />

            <Typography sx={lbl}>Device Type</Typography>
            <TextField
              select
              fullWidth size="small"
              name="deviceTypeId" value={formData.deviceTypeId} onChange={handleFormChange} required
              sx={{ mb: 2 }}
            >
              <MenuItem value="" disabled>Select Device Type</MenuItem>
              {deviceTypes.map(dt => (
                <MenuItem key={dt.deviceTypeId} value={dt.deviceTypeId}>
                  {dt.deviceTypeName}
                </MenuItem>
              ))}
            </TextField>

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
          <Button onClick={handleCloseModal} variant="outlined" disabled={submitMutation.isPending} sx={{ px: 3 }}>Cancel</Button>
          <Button type="submit" form="accessory-form" variant="contained" disabled={submitMutation.isPending} sx={{ px: 3, minWidth: 100 }}>
            {submitMutation.isPending ? <CircularProgress size={24} color="inherit" /> : (modalMode === 'create' ? 'Save Accessory' : 'Update Accessory')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>Confirm Deletion</DialogTitle>
        <Divider />
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedIds.length === 1 ? 'this accessory' : `these ${selectedIds.length} accessories`}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteConfirm(false)} color="inherit" disabled={deleteMutation.isPending}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteMutation.isPending} sx={{ minWidth: 90 }}>
             {deleteMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
