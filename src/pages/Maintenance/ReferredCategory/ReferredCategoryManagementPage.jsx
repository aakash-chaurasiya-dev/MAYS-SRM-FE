import { useState, useMemo } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Button, Divider, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { List } from '../../../stereotype/AbstractList';
import api from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import DeleteConfirmDialog from '../../../components/DeleteConfirmDialog';

export default function ReferredCategoryManagementPage() {
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
    referredCategoryId: '', referredCategoryName: '', referredCategoryDescription: '', isLocked: false,
  };
  const [formData, setFormData] = useState(initialFormState);

  const selectedRowsAreLocked = selectedIds.some(id => {
    const row = referredCategories.find(b => String(b.id) === String(id));
    return row?.isLocked;
  });

  const { data: rawReferredCategories = [] } = useQuery({
    queryKey: ['referredCategories'],
    queryFn: async () => {
      const response = await api.get('/referred-categories');
      return response.data?.data || response.data || [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const referredCategories = useMemo(() => {
    return rawReferredCategories.map((rc, index) => ({
      ...rc,
      id: rc.referredCategoryId || `fallback-id-${index}`,
    }));
  }, [rawReferredCategories]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData(initialFormState);
    setOpenModal(true);
  };

  const handleOpenUpdateModal = () => {
    if (selectedIds.length !== 1) return;
    const rcToUpdate = referredCategories.find(rc => String(rc.id) === String(selectedIds[0]));
    if (rcToUpdate) {
      setModalMode('update');
      setFormData({
        referredCategoryId: rcToUpdate.referredCategoryId || '',
        referredCategoryName: rcToUpdate.referredCategoryName || '',
        referredCategoryDescription: rcToUpdate.referredCategoryDescription || '',
        isLocked: rcToUpdate.isLocked || false,
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
        return api.post('/referred-categories', payload);
      } else {
        return api.put(`/referred-categories/${formData.referredCategoryId}`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referredCategories'] });
      if (modalMode !== 'create') {
        setSelectedIds([]); 
        setClearSelectionKey(prev => prev + 1);
      }
      handleCloseModal();
    },
    onError: (error) => {
      console.error(`Failed to ${modalMode} referred category:`, error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (rcId) => api.delete(`/referred-categories/${rcId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referredCategories'] });
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey(prev => prev + 1);
    },
    onError: (error) => {
      console.error('Failed to delete referred category:', error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate({
      referredCategoryName: formData.referredCategoryName,
      referredCategoryDescription: formData.referredCategoryDescription,
      isLocked: formData.isLocked || false,
    });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(selectedIds[0]);
  };

  const config = useMemo(() => ({
    title: 'Referred Category Management',
    subtitle: `${referredCategories.length} referred categories configured`,
    rows: referredCategories,
    columns: [
      { field: 'id', headerName: 'Category ID', width: 110 },
      { field: 'referredCategoryName', headerName: 'Category Name', flex: 1.5, renderType: 'link' },
      { field: 'referredCategoryDescription', headerName: 'Description', flex: 2 },
      { field: 'createdAt', headerName: 'Created At', width: 150, type: 'date', valueGetter: (value) => value ? new Date(value) : null },
      { field: 'updatedAt', headerName: 'Updated At', width: 150, type: 'date', valueGetter: (value) => value ? new Date(value) : null },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search referred categories…',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 480,
    gridKey: clearSelectionKey,
    getRowClassName: (params) => params.row?.isLocked ? 'locked-row' : '',
    actions: [
      { label: 'Add Referred Category', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreateModal },
    ],
  }), [referredCategories, clearSelectionKey]);

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
          Referred Category Management
        </Typography>
        <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
          Manage various referred categories for tracking and assigning service requests.
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
          {modalMode === 'create' ? 'Add New Referred Category' : 'Update Referred Category'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box component="form" id="referredcategory-form" onSubmit={handleSubmit}>
            <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, mb: 2.5 }}>
              {modalMode === 'create' ? 'Register a new referred category.' : 'Update the details of the selected referred category.'}
            </Typography>

            <Typography sx={{ ...lbl, mt: 0 }}>Category Name</Typography>
            <TextField
              fullWidth size="small" placeholder="e.g. Employee, Vendor"
              name="referredCategoryName" value={formData.referredCategoryName} onChange={handleFormChange} required
              sx={{ mb: 2 }}
            />

            <Typography sx={lbl}>Description</Typography>
            <TextField
              fullWidth size="small" placeholder="Enter description details"
              name="referredCategoryDescription" value={formData.referredCategoryDescription} onChange={handleFormChange}
              multiline rows={3}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} variant="outlined" disabled={submitMutation.isPending} sx={{ px: 3 }}>Cancel</Button>
          <Button type="submit" form="referredcategory-form" variant="contained" disabled={submitMutation.isPending} sx={{ px: 3, minWidth: 100 }}>
            {submitMutation.isPending ? <CircularProgress size={24} color="inherit" /> : (modalMode === 'create' ? 'Save Category' : 'Update Category')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <DeleteConfirmDialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        itemType="referred category"
        count={selectedIds.length}
        isLoading={deleteMutation.isPending}
      />
    </Box>
  );
}
