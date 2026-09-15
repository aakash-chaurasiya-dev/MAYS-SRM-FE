import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  MenuItem,
  CircularProgress,
  Button,
  Divider,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { List } from '../../stereotype/AbstractList';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { validateEmail, validateMobile, validatePassword } from '../../utils/validation';

export default function EmployeeDetails() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [selectedIds, setSelectedIds] = useState([]);
  const [clearSelectionKey, setClearSelectionKey] = useState(0);

  // Modal & Form State
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'update'
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Field-level inline errors
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    mobileNo: '',
    password: '',
  });

  const setFieldError = (field, message) =>
    setFieldErrors((prev) => ({ ...prev, [field]: message || '' }));

  // Delete Confirmation State
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const initialFormState = {
    employeeId: '',
    employeeName: '',
    departmentId: '',
    address: '',
    pincode: '',
    city: '',
    email: '',
    mobileNo: '',
    password: '',
    isActive: true,
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get('/employees');
      const data = response.data?.data || response.data || [];
      setEmployees(
        data.map((emp, index) => ({
          ...emp,
          id: emp.employeeId || emp.id || `fallback-id-${index}`,
          name: emp.employeeName,
          department: emp.departmentName,
          status: emp.isActive ? 'Active' : 'Inactive',
        }))
      );
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

  const resetFieldErrors = () =>
    setFieldErrors({ email: '', mobileNo: '', password: '' });

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData(initialFormState);
    setFormError('');
    resetFieldErrors();
    setOpenModal(true);
  };

  const handleOpenUpdateModal = () => {
    if (selectedIds.length !== 1) return;
    const employeeToUpdate = employees.find(
      (emp) => String(emp.id) === String(selectedIds[0])
    );
    if (employeeToUpdate) {
      setModalMode('update');
      setFormData({
        employeeId: employeeToUpdate.employeeId || '',
        employeeName: employeeToUpdate.employeeName || '',
        departmentId: employeeToUpdate.departmentId || '',
        address: employeeToUpdate.address || '',
        pincode: employeeToUpdate.pincode || '',
        city: employeeToUpdate.city || '',
        email: employeeToUpdate.email || '',
        mobileNo: employeeToUpdate.mobileNo || '',
        password: '', // Kept empty so user can leave it unchanged or type a new one
        isActive: Boolean(employeeToUpdate.isActive),
      });
      setFormError('');
      resetFieldErrors();
      setOpenModal(true);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setFormData(initialFormState);
    setFormError('');
    resetFieldErrors();
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormError('');

    // ── Mobile: digits only, max 10, live validation ──
    if (name === 'mobileNo') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, mobileNo: digits }));
      if (!digits) setFieldError('mobileNo', '');
      else if (digits.length < 10) setFieldError('mobileNo', 'Mobile number must be exactly 10 digits');
      else if (!validateMobile(digits)) setFieldError('mobileNo', 'Mobile number must start with 6, 7, 8 or 9');
      else setFieldError('mobileNo', '');
      return;
    }

    // ── Email: live validation ──
    if (name === 'email') {
      setFormData((prev) => ({ ...prev, email: value }));
      if (!value.trim()) setFieldError('email', '');
      else if (!validateEmail(value.trim())) setFieldError('email', 'Enter a valid email address');
      else setFieldError('email', '');
      return;
    }

    // ── Password: live validation (optional on update) ──
    if (name === 'password') {
      setFormData((prev) => ({ ...prev, password: value }));
      if (!value) {
        // Required only on create
        setFieldError('password', modalMode === 'create' ? 'Password is required' : '');
      } else {
        const pwdError = validatePassword(value);
        setFieldError('password', pwdError || '');
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Block submit if inline errors exist
    if (
      fieldErrors.email ||
      fieldErrors.mobileNo ||
      fieldErrors.password
    ) {
      setFormError('Please fix the highlighted fields before saving.');
      return;
    }

    // Hard requirement checks
    if (!formData.mobileNo || !validateMobile(formData.mobileNo)) {
      setFieldError('mobileNo', 'Enter a valid 10-digit mobile number starting with 6-9');
      setFormError('Please enter a valid mobile number.');
      return;
    }
    if (!formData.email || !validateEmail(formData.email)) {
      setFieldError('email', 'Enter a valid email address');
      setFormError('Please enter a valid email address.');
      return;
    }
    if (modalMode === 'create' && !formData.password) {
      setFieldError('password', 'Password is required');
      setFormError('Password is required');
      return;
    }
    if (formData.password) {
      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        setFieldError('password', passwordError);
        setFormError(passwordError);
        return;
      }
    }

    setSubmitLoading(true);
    try {
      if (modalMode === 'create') {
        await api.post('/employees', formData);
      } else {
        await api.put(`/employees/${formData.employeeId}`, formData);
        setSelectedIds([]);
        setClearSelectionKey((prev) => prev + 1); // Force DataGrid to remount and clear visual checks
      }
      handleCloseModal();
      fetchEmployees(); // Refresh the list
    } catch (error) {
      console.error(`Failed to ${modalMode} employee:`, error);
      setFormError(
        error.response?.data?.message || `Failed to ${modalMode} employee. Please try again.`
      );
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
      setClearSelectionKey((prev) => prev + 1);
      fetchEmployees();
    } catch (error) {
      console.error('Failed to delete employees:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const employeeConfig = useMemo(
    () => ({
      title: 'Team Members',
      subtitle: `${employees.length} employees across all departments`,
      rows: employees,
      columns: [
        { field: 'id', headerName: 'ID', flex: 0.5, minWidth: 70 },
        { field: 'name', headerName: 'Employee', renderType: 'avatar', flex: 1.4, minWidth: 200 },
        { field: 'email', headerName: 'Email', renderType: 'link', flex: 1.3, minWidth: 200 },
        { field: 'department', headerName: 'Department', flex: 1, minWidth: 130 },
        { field: 'mobileNo', headerName: 'Contact', flex: 1, minWidth: 150 },
        { field: 'address', headerName: 'Address', flex: 1.5, minWidth: 200 },
        { field: 'city', headerName: 'City', flex: 0.8, minWidth: 110 },
        { field: 'pincode', headerName: 'Pincode', flex: 0.8, minWidth: 100 },
        {
          field: 'status',
          headerName: 'Status',
          renderType: 'chip',
          chipColorMap: { Active: 'success', Inactive: 'error' },
          flex: 0.8,
          minWidth: 110,
        },
      ],
      checkboxSelection: true,
      searchable: true,
      searchPlaceholder: 'Search employees by name, email, dept…',
      pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
      height: 480,
      gridKey: clearSelectionKey,
      actions: [
        {
          label: 'Add Employee',
          icon: <AddIcon />,
          variant: 'contained',
          color: 'primary',
          onClick: handleOpenCreateModal,
        },
      ],
      onRowClick: (params) => navigate(`/employees/${params.row.id}`),
    }),
    [employees, clearSelectionKey, navigate]
  );

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
          {modalMode === 'create' ? 'Create Employee' : 'Update Employee'}
        </DialogTitle>
        <Divider />
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}

          <Box
            component="form"
            id="employee-form"
            onSubmit={handleSubmit}
            sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}
          >
            <TextField
              label="Employee Name"
              name="employeeName"
              required
              value={formData.employeeName}
              onChange={handleFormChange}
              fullWidth
              size="small"
            />

            <TextField
              label="Email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleFormChange}
              error={Boolean(fieldErrors.email)}
              helperText={fieldErrors.email}
              fullWidth
              size="small"
            />

            <TextField
              label="Mobile Number"
              name="mobileNo"
              required
              value={formData.mobileNo}
              onChange={handleFormChange}
              error={Boolean(fieldErrors.mobileNo)}
              helperText={fieldErrors.mobileNo}
              fullWidth
              size="small"
              slotProps={{
                htmlInput: { maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' },
              }}
            />

            <TextField
              label="Password"
              name="password"
              type="password"
              required={modalMode === 'create'}
              value={formData.password}
              onChange={handleFormChange}
              error={Boolean(fieldErrors.password)}
              helperText={
                fieldErrors.password ||
                (modalMode === 'update' ? 'Leave blank to keep current password' : '')
              }
              fullWidth
              size="small"
            />

            <TextField
              select
              label="Department"
              name="departmentId"
              required
              value={formData.departmentId}
              onChange={handleFormChange}
              fullWidth
              size="small"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.departmentId} value={dept.departmentId}>
                  {dept.departmentName}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="City"
              name="city"
              value={formData.city}
              onChange={handleFormChange}
              fullWidth
              size="small"
            />

            <TextField
              label="Pincode"
              name="pincode"
              value={formData.pincode}
              onChange={handleFormChange}
              fullWidth
              size="small"
            />

            <Box sx={{ gridColumn: 'span 2' }}>
              <TextField
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleFormChange}
                fullWidth
                size="small"
                multiline
                rows={2}
              />
            </Box>

            <Box sx={{ gridColumn: 'span 2' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleFormChange}
                    color="primary"
                  />
                }
                label="Active Employee"
              />
            </Box>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseModal}
            color="inherit"
            disabled={submitLoading}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="employee-form"
            variant="contained"
            disabled={submitLoading}
            sx={{ textTransform: 'none', minWidth: 100 }}
          >
            {submitLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>
          Confirm Deletion
        </DialogTitle>
        <Divider />
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{' '}
            {selectedIds.length === 1
              ? 'this employee'
              : `these ${selectedIds.length} employees`}
            ? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenDeleteConfirm(false)}
            color="inherit"
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteLoading}
            sx={{ minWidth: 90 }}
          >
            {deleteLoading ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}