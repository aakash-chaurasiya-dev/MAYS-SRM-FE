import { useState, useMemo } from 'react';
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
import DeleteConfirmDialog from '../../../components/DeleteConfirmDialog';

export default function DeviceModelManagementPage() {
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
    modelId: '', modelName: '', modelDescription: '', brandId: '', deviceTypeId: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const { data: rawDeviceModels = [] } = useQuery({
    queryKey: ['deviceModels'],
    queryFn: async () => {
      const response = await api.get('/devicemodels');
      return response.data?.data || response.data || [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const { data: rawBrands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await api.get('/brands');
      return response.data?.data || response.data || [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const { data: rawDeviceTypes = [] } = useQuery({
    queryKey: ['deviceTypes'],
    queryFn: async () => {
      const response = await api.get('/devicetypes');
      return response.data?.data || response.data || [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const deviceModels = useMemo(() => {
    return rawDeviceModels.map((model, index) => ({
      ...model,
      id: model.modelId || `fallback-id-${index}`,
    }));
  }, [rawDeviceModels]);

  const brands = useMemo(() => {
    return rawBrands.map((brand, index) => ({
      ...brand,
      id: brand.brandId || `fallback-id-${index}`,
    }));
  }, [rawBrands]);

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
    const modelToUpdate = deviceModels.find(m => String(m.id) === String(selectedIds[0]));
    if (modelToUpdate) {
      setModalMode('update');
      
      // Try to match brandId from brandName if possible
      let matchedBrandId = '';
      let matchedDeviceTypeId = '';
      if (modelToUpdate.brandName && brands.length > 0) {
        const match = brands.find(b => 
          b.brandName === modelToUpdate.brandName || 
          b.name === modelToUpdate.brandName
        );
        if (match) {
          matchedBrandId = match.brandId || match.id || '';
          matchedDeviceTypeId = match.deviceTypeId || '';
        }
      }

      // If response DTO implicitly contains brandId, use it
      const existingBrandId = modelToUpdate.brandId || matchedBrandId;
      const existingDeviceTypeId = modelToUpdate.deviceTypeId || matchedDeviceTypeId;

      setFormData({
        modelId: modelToUpdate.modelId || '',
        modelName: modelToUpdate.modelName || '',
        modelDescription: modelToUpdate.modelDescription || '',
        brandId: existingBrandId,
        deviceTypeId: existingDeviceTypeId,
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
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'deviceTypeId') {
        updated.brandId = ''; // Reset brand when device type changes
      }
      return updated;
    });
  };

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      if (modalMode === 'create') {
        return api.post('/devicemodels', payload);
      } else {
        return api.put(`/devicemodels/${formData.modelId}`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deviceModels'] });
      if (modalMode !== 'create') {
        setSelectedIds([]); 
        setClearSelectionKey(prev => prev + 1);
      }
      handleCloseModal();
    },
    onError: (error) => {
      console.error(`Failed to ${modalMode} device model:`, error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (modelId) => api.delete(`/devicemodels/${modelId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deviceModels'] });
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey(prev => prev + 1);
    },
    onError: (error) => {
      console.error('Failed to delete device model:', error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate({
      modelName: formData.modelName,
      modelDescription: formData.modelDescription,
      brandId: formData.brandId,
    });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(selectedIds[0]);
  };

  const deviceModelConfig = useMemo(() => ({
    title: 'Device Model Management',
    subtitle: `${deviceModels.length} models configured`,
    rows: deviceModels,
    columns: [
      { field: 'id', headerName: 'Model ID', width: 90 },
      { field: 'modelName', headerName: 'Model Name', flex: 1.2, renderType: 'link' },
      { field: 'modelDescription', headerName: 'Description', flex: 2 },
      { field: 'deviceTypeName', headerName: 'Device Type', flex: 1.5 },
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

            <Typography sx={lbl}>Device Type</Typography>
            <TextField
              fullWidth size="small" select
              name="deviceTypeId" value={formData.deviceTypeId} onChange={handleFormChange} required
              sx={{ mb: 2 }}
            >
              <MenuItem value="" disabled>Select device type…</MenuItem>
              {deviceTypes.map((dt) => (
                <MenuItem key={dt.deviceTypeId || dt.id} value={dt.deviceTypeId || dt.id}>
                  {dt.deviceTypeName || dt.name}
                </MenuItem>
              ))}
            </TextField>

            <Typography sx={lbl}>Brand</Typography>
            <TextField
              fullWidth size="small" select
              name="brandId" value={formData.brandId} onChange={handleFormChange} required disabled={!formData.deviceTypeId}
              sx={{ mb: 2 }}
            >
              <MenuItem value="" disabled>Select brand…</MenuItem>
              {brands
                .filter((b) => String(b.deviceTypeId) === String(formData.deviceTypeId))
                .map((b) => (
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
          <Button onClick={handleCloseModal} variant="outlined" disabled={submitMutation.isPending} sx={{ px: 3 }}>Cancel</Button>
          <Button type="submit" form="model-form" variant="contained" disabled={submitMutation.isPending} sx={{ px: 3, minWidth: 100 }}>
            {submitMutation.isPending ? <CircularProgress size={24} color="inherit" /> : (modalMode === 'create' ? 'Save Model' : 'Update Model')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <DeleteConfirmDialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        itemType="model"
        count={selectedIds.length}
        isLoading={deleteMutation.isPending}
      />
    </Box>
  );
}
