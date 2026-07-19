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

export default function BrandManagementPage() {
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
    brandId: '', brandName: '', brandDescription: '', deviceTypeId: '',
  };
  const [formData, setFormData] = useState(initialFormState);

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
    const brandToUpdate = brands.find(b => String(b.id) === String(selectedIds[0]));
    if (brandToUpdate) {
      setModalMode('update');
      
      // Try to match deviceTypeId from deviceTypeName if possible
      let matchedDeviceTypeId = '';
      if (brandToUpdate.deviceTypeName && deviceTypes.length > 0) {
        const match = deviceTypes.find(dt => 
          dt.deviceTypeName === brandToUpdate.deviceTypeName || 
          dt.name === brandToUpdate.deviceTypeName
        );
        if (match) {
          matchedDeviceTypeId = match.deviceTypeId || match.id || '';
        }
      }

      // If response DTO implicitly contains deviceTypeId, use it
      const existingDeviceTypeId = brandToUpdate.deviceTypeId || matchedDeviceTypeId;

      setFormData({
        brandId: brandToUpdate.brandId || '',
        brandName: brandToUpdate.brandName || '',
        brandDescription: brandToUpdate.brandDescription || '',
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      if (modalMode === 'create') {
        return api.post('/brands', payload);
      } else {
        return api.put(`/brands/${formData.brandId}`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      if (modalMode !== 'create') {
        setSelectedIds([]); 
        setClearSelectionKey(prev => prev + 1);
      }
      handleCloseModal();
    },
    onError: (error) => {
      console.error(`Failed to ${modalMode} brand:`, error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (brandId) => api.delete(`/brands/${brandId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey(prev => prev + 1);
    },
    onError: (error) => {
      console.error('Failed to delete brand:', error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate({
      brandName: formData.brandName,
      brandDescription: formData.brandDescription,
      deviceTypeId: formData.deviceTypeId,
    });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(selectedIds[0]);
  };

  const brandConfig = useMemo(() => ({
    title: 'Brand Management',
    subtitle: `${brands.length} brands configured`,
    rows: brands,
    columns: [

      { field: 'id', headerName: 'Brand ID', width: 90 },
      { field: 'brandName', headerName: 'Brand Name', flex: 1.2, renderType: 'link' },
      { field: 'brandDescription', headerName: 'Description', flex: 2 },
      { field: 'deviceTypeName', headerName: 'Device Type', flex: 1.5 },
      { field: 'insertDate', headerName: 'Created At', width: 130, type: 'date', valueGetter: (params) => params.value ? new Date(params.value) : null },
      { field: 'lastUpdateDate', headerName: 'Updated At', width: 130, type: 'date', valueGetter: (params) => params.value ? new Date(params.value) : null },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search brands…',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 480,
    gridKey: clearSelectionKey,
    getRowClassName: (params) => params.row?.isLocked ? 'locked-row' : '',
    actions: [
      { label: 'Add Brand', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreateModal },
    ],
  }), [brands, clearSelectionKey]);

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.8, mt: 2,
  };
  const selectedRowsAreLocked = selectedIds.some(id => {
    const row = brands.find(b => String(b.id) === String(id));
    return row?.isLocked;
  });

  return (
    <Box sx={{ p: 2 }}>

      <List 
        config={brandConfig} 
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

      {/* ── Brand Modal (Create/Update) ── */}
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
          {modalMode === 'create' ? 'Add New Brand' : 'Update Brand'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box component="form" id="brand-form" onSubmit={handleSubmit}>
            <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, mb: 2.5 }}>
              {modalMode === 'create' ? 'Register a new manufacturing partner to the system.' : 'Update the details of the selected brand.'}
            </Typography>

            <Typography sx={{ ...lbl, mt: 0 }}>Brand Name</Typography>
            <TextField
              fullWidth size="small" placeholder="e.g. Samsung"
              name="brandName" value={formData.brandName} onChange={handleFormChange} required
              sx={{ mb: 2 }}
            />

            <Typography sx={lbl}>Brand Description</Typography>
            <TextField
              fullWidth size="small" placeholder="Enter brand description"
              name="brandDescription" value={formData.brandDescription} onChange={handleFormChange} required
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
              {/* Fallback option if list is empty or fails to load but we need one */}
              {deviceTypes.length === 0 && (
                 <MenuItem value={formData.deviceTypeId} sx={{ display: formData.deviceTypeId ? 'block' : 'none' }}>
                   {formData.deviceTypeId} (Current)
                 </MenuItem>
              )}
            </TextField>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} variant="outlined" disabled={submitMutation.isPending} sx={{ px: 3 }}>Cancel</Button>
          <Button type="submit" form="brand-form" variant="contained" disabled={submitMutation.isPending} sx={{ px: 3, minWidth: 100 }}>
            {submitMutation.isPending ? <CircularProgress size={24} color="inherit" /> : (modalMode === 'create' ? 'Save Brand' : 'Update Brand')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>Confirm Deletion</DialogTitle>
        <Divider />
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedIds.length === 1 ? 'this brand' : `these ${selectedIds.length} brands`}? This action cannot be undone.
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
