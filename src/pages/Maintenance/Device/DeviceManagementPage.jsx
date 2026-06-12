import { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, CircularProgress, Button, Divider, Typography, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { List } from '../../../stereotype/AbstractList';
import api from '../../../services/api';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

export default function DeviceManagementPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);
  
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
    originalSerialNo: '', serialNo: '', modelId: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchDevices = useCallback(async () => {
    try {
      const response = await api.get('/devices');
      const data = response.data?.data || response.data || [];
      setDevices(data.map((device, index) => ({
        ...device,
        id: device.serialNo || `fallback-id-${index}`,
      })));
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    }
  }, []);

  const fetchDeviceModels = useCallback(async () => {
    try {
      const response = await api.get('/devicemodels');
      const data = response.data?.data || response.data || [];
      setDeviceModels(data);
    } catch (error) {
      console.error('Failed to fetch device models:', error);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    fetchDeviceModels();
  }, [fetchDevices, fetchDeviceModels]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData(initialFormState);
    setOpenModal(true);
  };

  const handleOpenUpdateModal = () => {
    if (selectedIds.length !== 1) return;
    const deviceToUpdate = devices.find(d => String(d.id) === String(selectedIds[0]));
    if (deviceToUpdate) {
      setModalMode('update');
      
      // Try to match modelId from modelName if possible
      let matchedModelId = '';
      if (deviceToUpdate.modelName && deviceModels.length > 0) {
        const match = deviceModels.find(m => 
          m.modelName === deviceToUpdate.modelName || 
          m.name === deviceToUpdate.modelName
        );
        if (match) {
          matchedModelId = match.modelId || match.id || '';
        }
      }

      const existingModelId = deviceToUpdate.modelId || matchedModelId;

      setFormData({
        originalSerialNo: deviceToUpdate.serialNo || '',
        serialNo: deviceToUpdate.serialNo || '',
        modelId: existingModelId,
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
        serialNo: formData.serialNo,
        modelId: formData.modelId,
      };

      if (modalMode === 'create') {
        await api.post('/devices', payload);
      } else {
        await api.put(`/devices/${formData.originalSerialNo}`, payload);
        setSelectedIds([]); 
        setClearSelectionKey(prev => prev + 1);
      }
      handleCloseModal();
      fetchDevices();
    } catch (error) {
      console.error(`Failed to ${modalMode} device:`, error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      const deviceId = selectedIds[0];
      await api.delete(`/devices/${deviceId}`);
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey(prev => prev + 1);
      fetchDevices();
    } catch (error) {
      console.error('Failed to delete device:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const deviceConfig = useMemo(() => ({
    title: 'Device Management',
    subtitle: `${devices.length} devices registered`,
    rows: devices,
    columns: [
      { field: 'id', headerName: 'Serial No', flex: 1.5, renderType: 'link' },
      { field: 'modelName', headerName: 'Model Name', flex: 2 },
      { field: 'brandName', headerName: 'Brand Name', flex: 1.5 },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search devices by serial no…',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 480,
    gridKey: clearSelectionKey,
    actions: [
      { label: 'Register Device', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreateModal },
    ],
  }), [devices, clearSelectionKey]);

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
          Device Management
        </Typography>
        <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
          Manage physical device inventory and link them to respective models
        </Typography>
      </Box>

      <List 
        config={deviceConfig} 
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

      {/* ── Device Modal (Create/Update) ── */}
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
          {modalMode === 'create' ? 'Register New Device' : 'Update Device Info'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box component="form" id="device-form" onSubmit={handleSubmit}>
            <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, mb: 2.5 }}>
              {modalMode === 'create' ? 'Register a new physical device in the system.' : 'Update the serial number or model details of the selected device.'}
            </Typography>

            <Typography sx={{ ...lbl, mt: 0 }}>Serial Number</Typography>
            <TextField
              fullWidth size="small" placeholder="e.g. SN-12345ABCD"
              name="serialNo" value={formData.serialNo} onChange={handleFormChange} required
              sx={{ mb: 2 }}
            />

            <Typography sx={lbl}>Device Model</Typography>
            <TextField
              fullWidth size="small" select
              name="modelId" value={formData.modelId} onChange={handleFormChange} required
              sx={{ mb: 2 }}
            >
              <MenuItem value="" disabled>Select device model…</MenuItem>
              {deviceModels.map((m) => (
                <MenuItem key={m.modelId || m.id} value={m.modelId || m.id}>
                  {m.modelName || m.name} {m.brandName ? `(${m.brandName})` : ''}
                </MenuItem>
              ))}
              {/* Fallback option if list is empty or fails to load but we need one */}
              {deviceModels.length === 0 && (
                 <MenuItem value={formData.modelId} sx={{ display: formData.modelId ? 'block' : 'none' }}>
                   {formData.modelId} (Current)
                 </MenuItem>
              )}
            </TextField>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} variant="outlined" disabled={submitLoading} sx={{ px: 3 }}>Cancel</Button>
          <Button type="submit" form="device-form" variant="contained" disabled={submitLoading} sx={{ px: 3, minWidth: 100 }}>
            {submitLoading ? <CircularProgress size={24} color="inherit" /> : (modalMode === 'create' ? 'Register Device' : 'Update Device')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>Confirm Deletion</DialogTitle>
        <Divider />
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedIds.length === 1 ? 'this device' : `these ${selectedIds.length} devices`}? This action cannot be undone.
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
