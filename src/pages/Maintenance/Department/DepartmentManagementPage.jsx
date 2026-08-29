import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Button, Divider, Typography, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { List } from '../../../stereotype/AbstractList';
import api from '../../../services/api';
import { useTheme } from '@mui/material/styles';
import DeleteConfirmDialog from '../../../components/DeleteConfirmDialog';
import { KNOWN_ROLES } from '../../../access/featureAccess';

export default function DepartmentManagementPage() {
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
    departmentId: '', departmentName: '', departmentDescription: '', defaultRole: 'ROLE_ADMIN',
  };
  const [formData, setFormData] = useState(initialFormState);

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/departments');
      return response.data?.data || response.data || [];
    },
    select: (data) =>
      data.map((dept, index) => ({
        ...dept,
        id: dept.departmentId || `fallback-id-${index}`,
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
    const deptToUpdate = departments.find(d => String(d.id) === String(selectedIds[0]));
    if (deptToUpdate) {
      setModalMode('update');
      setFormData({
        departmentId: deptToUpdate.departmentId || '',
        departmentName: deptToUpdate.departmentName || '',
        departmentDescription: deptToUpdate.departmentDescription || '',
        defaultRole: deptToUpdate.defaultRole || 'ROLE_ADMIN',
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
        return api.post('/departments', payload);
      } else {
        return api.put(`/departments/${formData.departmentId}`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      if (modalMode !== 'create') {
        setSelectedIds([]); 
        setClearSelectionKey(prev => prev + 1);
      }
      handleCloseModal();
    },
    onError: (error) => {
      console.error(`Failed to ${modalMode} department:`, error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (deptId) => api.delete(`/departments/${deptId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey(prev => prev + 1);
    },
    onError: (error) => {
      console.error('Failed to delete department:', error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate({
      departmentName: formData.departmentName,
      departmentDescription: formData.departmentDescription,
      defaultRole: formData.defaultRole,
    });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(selectedIds[0]);
  };

  const selectedRowsAreLocked = selectedIds.some(id => {
    const row = departments.find(b => String(b.id) === String(id));
    return row?.isLocked;
  });

  const config = useMemo(() => ({
    title: 'Department Management',
    subtitle: `${departments.length} departments configured`,
    rows: departments,
    columns: [

      { field: 'id', headerName: 'Department ID', width: 140 },
      { field: 'departmentName', headerName: 'Department Name', flex: 1.2, renderType: 'link' },
      { field: 'defaultRole', headerName: 'Default Role', flex: 1, valueGetter: (value) => value ? String(value).replace('ROLE_', '') : '—' },
      { field: 'departmentDescription', headerName: 'Description', flex: 2 },
      { field: 'insertDate', headerName: 'Created At', width: 130, type: 'date', valueGetter: (value) => value ? new Date(value) : null },
      { field: 'lastUpdateDate', headerName: 'Updated At', width: 130, type: 'date', valueGetter: (value) => value ? new Date(value) : null },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search departments…',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 480,
    gridKey: clearSelectionKey,
    getRowClassName: (params) => params.row?.isLocked ? 'locked-row' : '',
    headerActions: [
      { label: 'Update', icon: <EditOutlinedIcon />, variant: 'outlined', color: 'primary', disabled: selectedIds.length !== 1 || selectedRowsAreLocked, onClick: handleOpenUpdateModal },
      { label: 'Delete', icon: <DeleteOutlinedIcon />, variant: 'outlined', color: 'error', disabled: selectedIds.length === 0 || selectedRowsAreLocked, onClick: () => setOpenDeleteConfirm(true) },
    ],
    actions: [
      { label: 'Add Department', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreateModal },
    ],
  }), [departments, clearSelectionKey, selectedIds, selectedRowsAreLocked]);

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.8, mt: 2,
  };
  

  return (
    <Box>
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
          {modalMode === 'create' ? 'Add New Department' : 'Update Department'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box component="form" id="department-form" onSubmit={handleSubmit}>
            <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, mb: 2.5 }}>
              {modalMode === 'create' ? 'Register a new department to the system.' : 'Update the details of the selected department.'}
            </Typography>

            <Typography sx={{ ...lbl, mt: 0 }}>Department Name</Typography>
            <TextField
              fullWidth size="small" placeholder="e.g. Hardware Repair"
              name="departmentName" value={formData.departmentName} onChange={handleFormChange} required
              sx={{ mb: 2 }}
            />

            <Typography sx={lbl}>Department Description</Typography>
            <TextField
              fullWidth size="small" placeholder="Enter department description"
              name="departmentDescription" value={formData.departmentDescription} onChange={handleFormChange} required
              multiline rows={3}
              sx={{ mb: 2 }}
            />

            <Typography sx={lbl}>Default Role</Typography>
            <TextField
              select
              fullWidth
              size="small"
              name="defaultRole"
              value={formData.defaultRole}
              onChange={handleFormChange}
              required
              sx={{ mb: 2 }}
              helperText="Employees in this department get this role for app access"
            >
              {KNOWN_ROLES.filter((r) => r !== 'ROLE_VENDOR' && r !== 'ROLE_USER').map((role) => (
                <MenuItem key={role} value={role}>
                  {role.replace('ROLE_', '')}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} variant="outlined" disabled={submitMutation.isPending} sx={{ px: 3 }}>Cancel</Button>
          <Button type="submit" form="department-form" variant="contained" disabled={submitMutation.isPending} sx={{ px: 3, minWidth: 100 }}>
            {submitMutation.isPending ? <CircularProgress size={24} color="inherit" /> : (modalMode === 'create' ? 'Save Department' : 'Update Department')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <DeleteConfirmDialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        itemType="department"
        count={selectedIds.length}
        isLoading={deleteMutation.isPending}
      />
    </Box>
  );
}
