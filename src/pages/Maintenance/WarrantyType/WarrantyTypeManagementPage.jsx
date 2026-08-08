import { useState, useMemo } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Button, Divider, Typography, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { List } from '../../../stereotype/AbstractList';
import api from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import DeleteConfirmDialog from '../../../components/DeleteConfirmDialog';

export default function WarrantyTypeManagementPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const queryClient = useQueryClient();
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [clearSelectionKey, setClearSelectionKey] = useState(0);

  // Modal & Form State
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'update'
  
  // Delete Confirmation State
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  const initialFormState = {
    warrantyTypeId: '', warrantyTypeName: '', ticketTypeId: '', warrantyTypeDescription: '', isLocked: false,
  };
  const [formData, setFormData] = useState(initialFormState);



  // Fetch ticket types for parent dropdown selection
  const { data: ticketTypes = [] } = useQuery({
    queryKey: ['ticketTypes'],
    queryFn: async () => {
      const response = await api.get('/ticket-types');
      return response.data?.data || response.data || [];
    },
    select: (data) =>
      data.map((tt, index) => ({
        ...tt,
        id: tt.ticketTypeId || `fallback-id-${index}`,
      })),
    staleTime: 1000 * 60 * 60,
  });

  const { data: warrantyTypes = [] } = useQuery({
    queryKey: ['warrantyTypes'],
    queryFn: async () => {
      const response = await api.get('/warranty-types');
      return response.data?.data || response.data || [];
    },
    select: (data) =>
      data.map((wt, index) => ({
        ...wt,
        id: wt.warrantyTypeId || `fallback-id-${index}`,
      })),
    staleTime: 1000 * 60 * 60,
  });

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData(initialFormState);
    setOpenModal(true);
  };

  

  const handleOpenUpdateModal = () => {
    if (selectedIds.length !== 1) return;
    const wtToUpdate = warrantyTypes.find(wt => String(wt.id) === String(selectedIds[0]));
    if (wtToUpdate) {
      setModalMode('update');
      setFormData({
        warrantyTypeId: wtToUpdate.warrantyTypeId || '',
        warrantyTypeName: wtToUpdate.warrantyTypeName || '',
        ticketTypeId: wtToUpdate.ticketTypeId || '',
        warrantyTypeDescription: wtToUpdate.warrantyTypeDescription || '',
        isLocked: wtToUpdate.isLocked || false,
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

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      if (modalMode === 'create') {
        return api.post('/warranty-types', payload);
      } else {
        return api.put(`/warranty-types/${formData.warrantyTypeId}`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warrantyTypes'] });
      if (modalMode !== 'create') {
        setSelectedIds([]); 
        setClearSelectionKey(prev => prev + 1);
      }
      handleCloseModal();
    },
    onError: (error) => {
      console.error(`Failed to ${modalMode} warranty type:`, error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (wtId) => api.delete(`/warranty-types/${wtId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warrantyTypes'] });
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey(prev => prev + 1);
    },
    onError: (error) => {
      console.error('Failed to delete warranty type:', error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate({
      warrantyTypeName: formData.warrantyTypeName,
      ticketTypeId: formData.ticketTypeId ? Number(formData.ticketTypeId) : null,
      warrantyTypeDescription: formData.warrantyTypeDescription,
      isLocked: formData.isLocked || false,
    });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(selectedIds[0]);
  };

  const selectedRowsAreLocked = selectedIds.some(id => {
    const row = warrantyTypes.find(b => String(b.id) === String(id));
    return row?.isLocked;
  });

  const config = useMemo(() => ({
    title: 'Warranty Type Restructuring',
    subtitle: `${warrantyTypes.length} warranty types configured`,
    rows: warrantyTypes,
    columns: [
      { field: 'id', headerName: 'Warranty Type ID', width: 140 },
      { field: 'warrantyTypeName', headerName: 'Warranty Type Name', flex: 1.5, renderType: 'link' },
      { field: 'ticketTypeName', headerName: 'Associated Ticket Type', flex: 1.2 },
      { field: 'warrantyTypeDescription', headerName: 'Description', flex: 2 },
      { field: 'insertDate', headerName: 'Created At', width: 150, type: 'date', valueGetter: (value) => value ? new Date(value) : null },
      { field: 'updateDate', headerName: 'Updated At', width: 150, type: 'date', valueGetter: (value) => value ? new Date(value) : null },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search warranty types…',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 480,
    gridKey: clearSelectionKey,
    getRowClassName: (params) => params.row?.isLocked ? 'locked-row' : '',
    headerActions: [
      { label: 'Update', icon: <EditOutlinedIcon />, variant: 'outlined', color: 'primary', disabled: selectedIds.length !== 1 || selectedRowsAreLocked, onClick: handleOpenUpdateModal },
      { label: 'Delete', icon: <DeleteOutlinedIcon />, variant: 'outlined', color: 'error', disabled: selectedIds.length === 0 || selectedRowsAreLocked, onClick: () => setOpenDeleteConfirm(true) },
    ],
    actions: [
      { label: 'Add Warranty Type', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreateModal },
    ],
  }), [warrantyTypes, clearSelectionKey, selectedIds, selectedRowsAreLocked]);

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.8, mt: 2,
  };

  return (
    <Box>
      {/* Breadcrumb / Back */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/maintenance')}
          sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
          Maintenance
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
          Warranty Type Restructuring
        </Typography>
        <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
          Manage structured warranty types and map them to their corresponding ticketing profiles.
        </Typography>
      </Box>

      <List 
        config={config} 
        rowSelectionModel={selectedIds}
        onRowSelectionModelChange={setSelectedIds}
      />

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
          {modalMode === 'create' ? 'Add New Warranty Type' : 'Update Warranty Type'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box component="form" id="warrantytype-form" onSubmit={handleSubmit}>
            <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, mb: 2.5 }}>
              {modalMode === 'create' ? 'Register a new warranty type.' : 'Update the details of the selected warranty type.'}
            </Typography>

            <Typography sx={{ ...lbl, mt: 0 }}>Warranty Type Name</Typography>
            <TextField
              fullWidth size="small" placeholder="e.g. Under Warranty, Out of Warranty"
              name="warrantyTypeName" value={formData.warrantyTypeName} onChange={handleFormChange} required
              sx={{ mb: 2 }}
            />

            <Typography sx={lbl}>Associated Ticket Type</Typography>
            <TextField
              fullWidth size="small" select
              name="ticketTypeId" value={formData.ticketTypeId} onChange={handleFormChange}
              sx={{ mb: 2 }}
            >
              <MenuItem value=""><em>None / Not Specific</em></MenuItem>
              {ticketTypes.map((tt) => (
                <MenuItem key={tt.ticketTypeId} value={tt.ticketTypeId}>
                  {tt.ticketTypeName}
                </MenuItem>
              ))}
            </TextField>

            <Typography sx={lbl}>Description</Typography>
            <TextField
              fullWidth size="small" placeholder="Enter warranty type description"
              name="warrantyTypeDescription" value={formData.warrantyTypeDescription} onChange={handleFormChange}
              multiline rows={3}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} variant="outlined" disabled={submitMutation.isPending} sx={{ px: 3 }}>Cancel</Button>
          <Button type="submit" form="warrantytype-form" variant="contained" disabled={submitMutation.isPending} sx={{ px: 3, minWidth: 100 }}>
            {submitMutation.isPending ? <CircularProgress size={24} color="inherit" /> : (modalMode === 'create' ? 'Save Warranty Type' : 'Update Warranty Type')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <DeleteConfirmDialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        itemType="warranty type"
        count={selectedIds.length}
        isLoading={deleteMutation.isPending}
      />
    </Box>
  );
}
