import { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, FormControlLabel, Checkbox, MenuItem, CircularProgress, Button, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { List } from '../../stereotype/AbstractList';
import api from '../../services/api';

export default function EmployeeDetails() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  
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
    employeeId: '', employeeName: '', departmentId: '', vendor: false, address: '', pincode: '',
    city: '', email: '', mobileNo: '', password: '', isActive: true,
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get('/employees');
      const data = response.data?.data || response.data || [];
      setEmployees(data.map((emp, index) => ({
        ...emp,
        id: emp.employeeId || emp.id || `fallback-id-${index}`,
        name: emp.employeeName,
        department: emp.departmentName,
        status: emp.isActive ? 'Active' : 'Inactive',
      })));
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/departments');
        setDepartments(response.data?.data || response.data || []);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      }
    };
    fetchDepartments();
  }, [fetchEmployees]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData(initialFormState);
    setOpenModal(true);
  };

  const handleOpenUpdateModal = () => {
    if (selectedIds.length !== 1) return;
    const employeeToUpdate = employees.find(emp => String(emp.id) === String(selectedIds[0]));
    if (employeeToUpdate) {
      setModalMode('update');
      setFormData({
        employeeId: employeeToUpdate.employeeId || '',
        employeeName: employeeToUpdate.employeeName || '',
        departmentId: employeeToUpdate.departmentId || '',
        vendor: Boolean(employeeToUpdate.vendor),
        address: employeeToUpdate.address || '',
        pincode: employeeToUpdate.pincode || '',
        city: employeeToUpdate.city || '',
        email: employeeToUpdate.email || '',
        mobileNo: employeeToUpdate.mobileNo || '',
        password: '', // Kept empty so user can leave it unchanged or type a new one
        isActive: Boolean(employeeToUpdate.isActive),
      });
      setOpenModal(true);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setFormData(initialFormState);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (modalMode === 'create') {
        await api.post('/employees', formData);
      } else {
        await api.put(`/employees/${formData.employeeId}`, formData);
        setSelectedIds([]); 
        setClearSelectionKey(prev => prev + 1); // Force DataGrid to remount and clear visual checks
      }
      handleCloseModal();
      fetchEmployees(); // Refresh the list
    } catch (error) {
      console.error(`Failed to ${modalMode} employee:`, error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      // Delete single employee via path variable
      const employeeId = selectedIds[0];
      await api.delete(`/employees/${employeeId}`);
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey(prev => prev + 1);
      fetchEmployees();
    } catch (error) {
      console.error('Failed to delete employees:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const employeeConfig = useMemo(() => ({
    title: 'Team Members',
    subtitle: `${employees.length} employees across all departments`,
    rows: employees,
    columns: [
      { field: 'id', headerName: 'ID', flex: 0.5, minWidth: 70 },
      { field: 'name', headerName: 'Employee', renderType: 'avatar', flex: 1.4, minWidth: 200 },
      { field: 'email', headerName: 'Email', renderType: 'link', flex: 1.3, minWidth: 200 },
      { field: 'department', headerName: 'Department', flex: 1, minWidth: 130 },
      { field: 'mobileNo', headerName: 'Contact', flex: 1, minWidth: 150 },
      { field: 'vendor', headerName: 'Vendor', flex: 1, minWidth: 130 },
      { field: 'address', headerName: 'Address', flex: 1.5, minWidth: 200 },
      { field: 'city', headerName: 'City', flex: 0.8, minWidth: 110 },
      { field: 'pincode', headerName: 'Pincode', flex: 0.8, minWidth: 100 },
      { field: 'status', headerName: 'Status', renderType: 'chip', chipColorMap: { Active: 'success', Inactive: 'error' }, flex: 0.8, minWidth: 110 },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search employees by name, email, dept…',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 480,
    gridKey: clearSelectionKey,
    actions: [
      { label: 'Add Employee', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreateModal },
    ],
  }), [employees, clearSelectionKey]);

  return (
    <Box sx={{ p: 2 }}>
      <List 
        config={employeeConfig} 
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

      {/* ── Employee Modal (Create/Update) ── */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: '16px', fontWeight: 600 }}>
          {modalMode === 'create' ? 'Create New Employee' : 'Update Employee'}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Box component="form" id="employee-form" onSubmit={handleSubmit} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField label="Employee Name" name="employeeName" required value={formData.employeeName} onChange={handleFormChange} fullWidth size="small" />
            <TextField label="Email" name="email" type="email" required value={formData.email} onChange={handleFormChange} fullWidth size="small" />
            
            <TextField label="Mobile Number" name="mobileNo" required value={formData.mobileNo} onChange={handleFormChange} fullWidth size="small" />
            <TextField label="Password" name="password" type="password" required={modalMode === 'create'} value={formData.password} onChange={handleFormChange} fullWidth size="small" />
            
            <TextField select label="Department" name="departmentId" required value={formData.departmentId} onChange={handleFormChange} fullWidth size="small">
              <MenuItem value=""><em>None</em></MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.departmentId} value={dept.departmentId}>
                  {dept.departmentName}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={<Checkbox name="vendor" checked={Boolean(formData.vendor)} onChange={handleFormChange} color="primary" />}
              label="Is Vendor"
            />
            
            <TextField label="City" name="city" value={formData.city} onChange={handleFormChange} fullWidth size="small" />
            
            <TextField label="Pincode" name="pincode" value={formData.pincode} onChange={handleFormChange} fullWidth size="small" />
            <Box sx={{ gridColumn: 'span 2' }}>
              <TextField label="Address" name="address" value={formData.address} onChange={handleFormChange} fullWidth size="small" multiline rows={2} />
            </Box>

            <Box sx={{ gridColumn: 'span 2' }}>
              <FormControlLabel
                control={<Checkbox name="isActive" checked={formData.isActive} onChange={handleFormChange} color="primary" />}
                label="Active Employee"
              />
            </Box>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal} color="inherit" disabled={submitLoading} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button type="submit" form="employee-form" variant="contained" disabled={submitLoading} sx={{ textTransform: 'none', minWidth: 100 }}>
            {submitLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>Confirm Deletion</DialogTitle>
        <Divider />
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedIds.length === 1 ? 'this employee' : `these ${selectedIds.length} employees`}? This action cannot be undone.
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
