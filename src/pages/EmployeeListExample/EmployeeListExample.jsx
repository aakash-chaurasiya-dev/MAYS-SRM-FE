import { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControlLabel, Checkbox, MenuItem, CircularProgress, Button, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import { Tabs } from '../../stereotype/Tabs';
import { List } from '../../stereotype/AbstractList';
import api from '../../services/api';



const INITIAL_TABS = [
  { id: 'employees', label: 'Employees', icon: <PeopleAltOutlinedIcon />, removable: false },
];

/* Counter for dynamically added tabs */
let nextReportId = 1;

/* ════════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ════════════════════════════════════════════════════════════════ */

export default function EmployeePage() {
  const [tabs, setTabs] = useState(INITIAL_TABS);
  const [activeTab, setActiveTab] = useState('employees');

  // Modal & Form State
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    employeeName: '', departmentId: '', vendor: '', address: '', pincode: '',
    city: '', email: '', mobileNo: '', role: '', password: '', isActive: true,
  });

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get('/employees');
      const data = response.data?.data || response.data || [];
      // Mapping backend DTO structure to match the frontend AbstractList config expectations
      setEmployees(data.map(emp => ({
        ...emp,
        id: emp.employeeId,
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
        const response = await api.get('/departments'); // Update endpoint if necessary
        setDepartments(response.data?.data || response.data || []);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      }
    };
    fetchDepartments();
  }, [fetchEmployees]);

  const handleCloseModal = () => {
    setOpenModal(false);
    setFormData({
      employeeName: '', departmentId: '', vendor: '', address: '', pincode: '',
      city: '', email: '', mobileNo: '', role: '', password: '', isActive: true,
    });
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
      await api.post('/employees', formData);
      handleCloseModal();
      fetchEmployees(); // Refresh the list
    } catch (error) {
      console.error('Failed to create employee:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  /* ── Build a report-style list config for dynamic tabs ── */
  const buildReportConfig = useCallback((tabId, label) => ({
    title: label,
    subtitle: 'Auto-generated report view',
    rows: employees.slice(0, 5).map((row, i) => ({
      ...row,
      id: `${tabId}-${i}`,
      performance: Math.round(Math.random() * 100),
    })),
    columns: [
      { field: 'name', headerName: 'Name', renderType: 'avatar', flex: 1.3, minWidth: 180 },
      { field: 'department', headerName: 'Department', flex: 1, minWidth: 130 },
      { field: 'status', headerName: 'Status', renderType: 'chip', chipColorMap: { Active: 'success', Inactive: 'error', 'On Leave': 'warning' }, flex: 0.8, minWidth: 110 },
      { field: 'performance', headerName: 'Score', renderType: 'progress', flex: 1, minWidth: 140 },
    ],
    searchable: true,
    pagination: { pageSize: 5, pageSizeOptions: [5, 10] },
    height: 380,
  }), [employees]);

  // Config defined inside component so it has access to dynamic `employees` and `setOpenModal`
  const employeeConfig = useMemo(() => ({
    title: 'Team Members',
    subtitle: `${employees.length} employees across all departments`,
    rows: employees,
    columns: [
      { field: 'id', headerName: 'ID', flex: 0.5, minWidth: 70 },
      { field: 'name', headerName: 'Employee', renderType: 'avatar', flex: 1.4, minWidth: 200 },
      { field: 'email', headerName: 'Email', renderType: 'link', flex: 1.3, minWidth: 200 },
      { field: 'department', headerName: 'Department', flex: 1, minWidth: 130 },
      { field: 'role', headerName: 'Role', flex: 1.1, minWidth: 150 },
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
    actions: [
      { label: 'Add Employee', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: () => setOpenModal(true) },
    ],
  }), [employees]);

  const CONFIG_MAP = useMemo(() => ({
    employees: employeeConfig,
  }), [employeeConfig]);

  /* ── Dynamic configs for added tabs ── */
  const [dynamicConfigs, setDynamicConfigs] = useState({});

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const handleTabClose = useCallback((tabId) => {
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== tabId);
      // If closing the active tab, switch to the previous one
      if (tabId === activeTab && filtered.length > 0) {
        const closedIndex = prev.findIndex((t) => t.id === tabId);
        const newIndex = Math.min(closedIndex, filtered.length - 1);
        setActiveTab(filtered[newIndex].id);
      }
      return filtered;
    });
    setDynamicConfigs((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
  }, [activeTab]);

  const handleTabAdd = useCallback(() => {
    const id = `report-${nextReportId}`;
    const label = `Report ${nextReportId}`;
    nextReportId++;

    const newTab = {
      id,
      label,
      icon: <AssessmentOutlinedIcon />,
      removable: true,
    };

    setTabs((prev) => [...prev, newTab]);
    setDynamicConfigs((prev) => ({
      ...prev,
      [id]: buildReportConfig(id, label),
    }));
    setActiveTab(id);
  }, [buildReportConfig]);

  /* ── Resolve which config to render ── */
  const currentConfig = useMemo(() => {
    return CONFIG_MAP[activeTab] || dynamicConfigs[activeTab] || null;
  }, [activeTab, dynamicConfigs, CONFIG_MAP]);

  return (
    <Box>
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onTabClose={handleTabClose}
        onTabAdd={handleTabAdd}
        showAddButton
        addTooltip="Add report tab"
      />

      <Box sx={{ mt: 2.5 }}>
        {currentConfig ? (
          <List config={currentConfig} />
        ) : (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
            No content for this tab.
          </Box>
        )}
      </Box>

      {/* ── New Employee Modal ── */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: '16px', fontWeight: 600 }}>Create New Employee</DialogTitle>
        <Divider />
        <DialogContent>
          <Box component="form" id="new-employee-form" onSubmit={handleSubmit} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField label="Employee Name" name="employeeName" required value={formData.employeeName} onChange={handleFormChange} fullWidth size="small" />
            <TextField label="Email" name="email" type="email" required value={formData.email} onChange={handleFormChange} fullWidth size="small" />
            
            <TextField label="Mobile Number" name="mobileNo" required value={formData.mobileNo} onChange={handleFormChange} fullWidth size="small" />
            <TextField label="Role" name="role" required value={formData.role} onChange={handleFormChange} fullWidth size="small" />
            
            <TextField select label="Department" name="departmentId" required value={formData.departmentId} onChange={handleFormChange} fullWidth size="small">
              <MenuItem value=""><em>None</em></MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.departmentId} value={dept.departmentId}>
                  {dept.departmentName}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Vendor" name="vendor" value={formData.vendor} onChange={handleFormChange} fullWidth size="small" />
            
            <TextField label="Password" name="password" type="password" required value={formData.password} onChange={handleFormChange} fullWidth size="small" />
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
          <Button type="submit" form="new-employee-form" variant="contained" disabled={submitLoading} sx={{ textTransform: 'none', minWidth: 100 }}>
            {submitLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Employee'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
