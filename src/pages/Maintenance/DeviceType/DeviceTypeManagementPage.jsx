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

export default function DeviceTypeManagementPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [deviceTypes, setDeviceTypes] = useState([]);
  
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
    deviceTypeId: '', deviceTypeName: '', deviceTypeDescription: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchDeviceTypes = useCallback(async () => {
    try {
      const response = await api.get('/devicetypes');
      const data = response.data?.data || response.data || [];
      setDeviceTypes(data.map((type, index) => ({
        ...type,
        id: type.deviceTypeId || `fallback-id-${index}`,
      })));
    } catch (error) {
      console.error('Failed to fetch device types:', error);
    }
  }, []);

  useEffect(() => {
    fetchDeviceTypes();
  }, [fetchDeviceTypes]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData(initialFormState);
    setOpenModal(true);
  };

  const handleOpenUpdateModal = () => {
    if (selectedIds.length !== 1) return;
    const typeToUpdate = deviceTypes.find(t => String(t.id) === String(selectedIds[0]));
    if (typeToUpdate) {
      setModalMode('update');
      setFormData({
        deviceTypeId: typeToUpdate.deviceTypeId || '',
        deviceTypeName: typeToUpdate.deviceTypeName || '',
        deviceTypeDescription: typeToUpdate.deviceTypeDescription || '',
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
        deviceTypeName: formData.deviceTypeName,
        deviceTypeDescription: formData.deviceTypeDescription,
      };

      if (modalMode === 'create') {
        await api.post('/devicetypes', payload);
      } else {
        await api.put(`/devicetypes/${formData.deviceTypeId}`, payload);
        setSelectedIds([]); 
        setClearSelectionKey(prev => prev + 1);
      }
      handleCloseModal();
      fetchDeviceTypes();
    } catch (error) {
      console.error(`Failed to ${modalMode} device type:`, error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      const typeId = selectedIds[0];
      await api.delete(`/devicetypes/${typeId}`);
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey(prev => prev + 1);
      fetchDeviceTypes();
    } catch (error) {
      console.error('Failed to delete device type:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const config = useMemo(() => ({
    title: 'Device Type Management',
    subtitle: `${deviceTypes.length} device types configured`,
    rows: deviceTypes,
    columns: [
      { field: 'id', headerName: 'Type ID', width: 140 },
      { field: 'deviceTypeName', headerName: 'Type Name', flex: 1.2, renderType: 'link' },
      { field: 'deviceTypeDescription', headerName: 'Description', flex: 2 },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search device types…',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 480,
    gridKey: clearSelectionKey,
    actions: [
      { label: 'Add Device Type', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreateModal },
    ],
  }), [deviceTypes, clearSelectionKey]);

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
          Device Type Management
        </Typography>
        <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
          Manage device categories such as Laptops, Phones, Servers, etc.
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
          {modalMode === 'create' ? 'Add New Device Type' : 'Update Device Type'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box component="form" id="devicetype-form" onSubmit={handleSubmit}>
            <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, mb: 2.5 }}>
              {modalMode === 'create' ? 'Register a new device category to the system.' : 'Update the details of the selected device type.'}
            </Typography>

            <Typography sx={{ ...lbl, mt: 0 }}>Device Type Name</Typography>
            <TextField
              fullWidth size="small" placeholder="e.g. Laptop"
              name="deviceTypeName" value={formData.deviceTypeName} onChange={handleFormChange} required
              sx={{ mb: 2 }}
            />

            <Typography sx={lbl}>Description</Typography>
            <TextField
              fullWidth size="small" placeholder="Enter description"
              name="deviceTypeDescription" value={formData.deviceTypeDescription} onChange={handleFormChange} required
              multiline rows={3}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} variant="outlined" disabled={submitLoading} sx={{ px: 3 }}>Cancel</Button>
          <Button type="submit" form="devicetype-form" variant="contained" disabled={submitLoading} sx={{ px: 3, minWidth: 100 }}>
            {submitLoading ? <CircularProgress size={24} color="inherit" /> : (modalMode === 'create' ? 'Save Device Type' : 'Update Device Type')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>Confirm Deletion</DialogTitle>
        <Divider />
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedIds.length === 1 ? 'this device type' : `these ${selectedIds.length} device types`}? This action cannot be undone.
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
