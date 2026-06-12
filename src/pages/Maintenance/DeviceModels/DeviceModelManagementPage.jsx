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

export default function DeviceModelManagementPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [deviceModels, setDeviceModels] = useState([]);
  const [brands, setBrands] = useState([]);
  
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
    modelId: '', modelName: '', modelDescription: '', brandId: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchDeviceModels = useCallback(async () => {
    try {
      const response = await api.get('/devicemodels');
      const data = response.data?.data || response.data || [];
      setDeviceModels(data.map((model, index) => ({
        ...model,
        id: model.modelId || `fallback-id-${index}`,
      })));
    } catch (error) {
      console.error('Failed to fetch device models:', error);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const response = await api.get('/brands');
      const data = response.data?.data || response.data || [];
      setBrands(data);
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    }
  }, []);

  useEffect(() => {
    fetchDeviceModels();
    fetchBrands();
  }, [fetchDeviceModels, fetchBrands]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData(initialFormState);
    setOpenModal(true);
  };

  const handleOpenUpdateModal = () => {
    if (selectedIds.length !== 1) return;
    const modelToUpdate = deviceModels.find(m => String(m.id) === String(selectedIds[0]));
    if (modelToUpdate) {
      setModalMode('update');
      
      // Try to match brandId from brandName if possible
      let matchedBrandId = '';
      if (modelToUpdate.brandName && brands.length > 0) {
        const match = brands.find(b => 
          b.brandName === modelToUpdate.brandName || 
          b.name === modelToUpdate.brandName
        );
        if (match) {
          matchedBrandId = match.brandId || match.id || '';
        }
      }

      // If response DTO implicitly contains brandId, use it
      const existingBrandId = modelToUpdate.brandId || matchedBrandId;

      setFormData({
        modelId: modelToUpdate.modelId || '',
        modelName: modelToUpdate.modelName || '',
        modelDescription: modelToUpdate.modelDescription || '',
        brandId: existingBrandId,
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
        modelName: formData.modelName,
        modelDescription: formData.modelDescription,
        brandId: formData.brandId,
      };

      if (modalMode === 'create') {
        await api.post('/devicemodels', payload);
      } else {
        await api.put(`/devicemodels/${formData.modelId}`, payload);
        setSelectedIds([]); 
        setClearSelectionKey(prev => prev + 1);
      }
      handleCloseModal();
      fetchDeviceModels();
    } catch (error) {
      console.error(`Failed to ${modalMode} device model:`, error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      const modelId = selectedIds[0];
      await api.delete(`/devicemodels/${modelId}`);
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey(prev => prev + 1);
      fetchDeviceModels();
    } catch (error) {
      console.error('Failed to delete device model:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const deviceModelConfig = useMemo(() => ({
    title: 'Device Model Management',
    subtitle: `${deviceModels.length} models configured`,
    rows: deviceModels,
    columns: [
      { field: 'id', headerName: 'Model ID', width: 90 },
      { field: 'modelName', headerName: 'Model Name', flex: 1.2, renderType: 'link' },
      { field: 'modelDescription', headerName: 'Description', flex: 2 },
      { field: 'brandName', headerName: 'Brand', flex: 1.5 },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search models…',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 480,
    gridKey: clearSelectionKey,
    actions: [
      { label: 'Add Model', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreateModal },
    ],
  }), [deviceModels, clearSelectionKey]);

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
          Device Model Management
        </Typography>
        <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
          Manage hardware models and associate them with existing brands
        </Typography>
      </Box>

      <List 
        config={deviceModelConfig} 
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

      {/* ── Device Model Modal (Create/Update) ── */}
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
          {modalMode === 'create' ? 'Add New Device Model' : 'Update Device Model'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box component="form" id="model-form" onSubmit={handleSubmit}>
            <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, mb: 2.5 }}>
              {modalMode === 'create' ? 'Register a new device model to the system.' : 'Update the details of the selected model.'}
            </Typography>

            <Typography sx={{ ...lbl, mt: 0 }}>Model Name</Typography>
            <TextField
              fullWidth size="small" placeholder="e.g. iPhone 15 Pro"
              name="modelName" value={formData.modelName} onChange={handleFormChange} required
              sx={{ mb: 2 }}
            />

            <Typography sx={lbl}>Model Description</Typography>
            <TextField
              fullWidth size="small" placeholder="Enter model description"
              name="modelDescription" value={formData.modelDescription} onChange={handleFormChange} required
              multiline rows={3}
              sx={{ mb: 2 }}
            />

            <Typography sx={lbl}>Brand</Typography>
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
              {/* Fallback option if list is empty or fails to load but we need one */}
              {brands.length === 0 && (
                 <MenuItem value={formData.brandId} sx={{ display: formData.brandId ? 'block' : 'none' }}>
                   {formData.brandId} (Current)
                 </MenuItem>
              )}
            </TextField>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} variant="outlined" disabled={submitLoading} sx={{ px: 3 }}>Cancel</Button>
          <Button type="submit" form="model-form" variant="contained" disabled={submitLoading} sx={{ px: 3, minWidth: 100 }}>
            {submitLoading ? <CircularProgress size={24} color="inherit" /> : (modalMode === 'create' ? 'Save Model' : 'Update Model')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>Confirm Deletion</DialogTitle>
        <Divider />
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedIds.length === 1 ? 'this model' : `these ${selectedIds.length} models`}? This action cannot be undone.
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
