import { useEffect, useRef, useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Divider, Chip,
  Stack, Avatar, IconButton, MenuItem, Autocomplete
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const formatTimestamp = (value) => {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const createTimelineEntry = (log) => {
  const actor = log?.assignorEmployeeName || 'System';
  const timestamp = formatTimestamp(log?.modificationDate);

  let actionParts = [];

  if (log?.oldStatus && log?.newStatus && log.oldStatus !== log.newStatus) {
    actionParts.push(`Status updated from ${log.oldStatus} to ${log.newStatus}`);
  }

  if (log?.assigneeEmployeeName) {
    actionParts.push(`Assigned to ${log.assigneeEmployeeName}`);
  }

  if (log?.assignorRemarks) {
    actionParts.push(`Remarks: ${log.assignorRemarks}`);
  }

  const action = actionParts.length > 0 ? actionParts.join(' | ') : 'Ticket updated';

  return {
    user: actor,
    action,
    timestamp,
    type: 'update',
  };
};

export default function TicketDetailPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  const rawRole = user?.roles?.[0]?.authority || user?.role || 'ROLE_USER';
  const isNormalUser = rawRole === 'ROLE_USER';
  const [ticket, setTicket] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Dynamic dropdown state
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [statuses, setStatuses] = useState([]);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    employeeId: '',
    departmentId: '',
    ticketStatusId: '',
  });

  // Dynamic entity edit states
  const [isCustomerEditMode, setIsCustomerEditMode] = useState(false);
  const [isDeviceEditMode, setIsDeviceEditMode] = useState(false);
  const [isDescriptionEditMode, setIsDescriptionEditMode] = useState(false);
  const [tempDescription, setTempDescription] = useState('');
  const [customerOptions, setCustomerOptions] = useState([]);
  const [deviceOptions, setDeviceOptions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);

  // Editable device details form and dropdown lists states
  const [editDeviceForm, setEditDeviceForm] = useState({
    deviceTypeId: '',
    brandId: '',
    modelId: '',
    serialNo: '',
    warrantyType: '',
    customModelName: '',
  });
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);

  useEffect(() => {
    if (isNormalUser) return;
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/departments');
        setDepartments(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Failed to fetch departments', err);
      }
    };
    fetchDepartments();
  }, [isNormalUser]);

  useEffect(() => {
    if (isNormalUser) return;
    const fetchStatuses = async () => {
      try {
        const statustype = 'Ticket';
        const response = await api.get(`/statuses/type/${statustype}`);
        setStatuses(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Failed to fetch statuses', err);
      }
    };
    fetchStatuses();
  }, [isNormalUser]);

  useEffect(() => {
    if (isNormalUser || !editForm.departmentId) {
      setEmployees([]);
      return;
    }
    const fetchEmployees = async () => {
      try {
        const response = await api.get(`/employees/department/${editForm.departmentId}`);
        setEmployees(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Failed to fetch employees', err);
        setEmployees([]);
      }
    };
    fetchEmployees();
  }, [editForm.departmentId, isNormalUser]);

  const loadTicketDetails = async () => {
    try {
      setLoading(true);
      setError('');

      let ticketData = null;
      let logsData = [];
      let attachmentsData = [];

      if (isNormalUser) {
        const [ticketResponse, attachmentsResponse] = await Promise.all([
          api.get(`/tickets/${id}`),
          api.get(`/tickets/${id}/attachments`),
        ]);
        ticketData = ticketResponse.data;
        attachmentsData = attachmentsResponse.data;
      } else {
        const [ticketResponse, logsResponse, attachmentsResponse] = await Promise.all([
          api.get(`/tickets/${id}`),
          api.get(`/ticket-logs/${id}`),
          api.get(`/tickets/${id}/attachments`),
        ]);
        ticketData = ticketResponse.data;
        logsData = logsResponse.data;
        attachmentsData = attachmentsResponse.data;
      }

      const currentTicketId = Number(id);

      const filteredLogs = Array.isArray(logsData)
        ? logsData
          .filter(
            (log) => Number(log?.ticketId) === currentTicketId
          )
          .map(createTimelineEntry)
        : [];

      setTicket(ticketData);
      setAttachments(
        Array.isArray(attachmentsData)
          ? attachmentsData
          : []
      );
      setTimeline(filteredLogs);
    } catch (err) {
      console.error('Failed to load ticket details', err);

      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to load ticket details'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicketDetails();
  }, [id]);

  const handleAttachmentUpload = async (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setUploading(true);
    setUploadMessage('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await api.post(
        `/tickets/${id}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setUploadMessage(`Uploaded ${selectedFile.name}`);
      await loadTicketDetails();
    } catch (err) {
      setError(err.message || 'Unable to upload attachment');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEditClick = () => {
    setEditForm({
      employeeId: ticket?.employeeId || ticket?.assigneeEmployeeId || ticket?.employee?.employeeId || '',
      departmentId: ticket?.departmentId || ticket?.department?.departmentId || '',
      ticketStatusId: ticket?.ticketStatusId || '',
    });
    setIsEditMode(true);
  };

  const handleSaveClick = async () => {
    try {
      setLoading(true);
      setError('');
      
      const selectedDept = departments.find(d => String(d.departmentId || d.id) === String(editForm.departmentId));
      const selectedEmp = employees.find(e => String(e.employeeId || e.id) === String(editForm.employeeId));
      const selectedStatus = statuses.find(s => String(s.statusId || s.id) === String(editForm.ticketStatusId));

      const updatedTicket = {
        ...ticket,
        employeeId: editForm.employeeId || null,
        departmentId: editForm.departmentId || null,
        employeeName: selectedEmp ? (selectedEmp.employeeName || selectedEmp.name) : ticket?.employeeName,
        departmentName: selectedDept ? (selectedDept.departmentName || selectedDept.name) : ticket?.departmentName,
        ticketStatusId: editForm.ticketStatusId || null,
        ticketStatusName: selectedStatus ? (selectedStatus.statusName || selectedStatus.name) : ticket?.ticketStatusName,
      };

      await api.put(`/tickets/${id}`, updatedTicket);
      
      setIsEditMode(false);
      await loadTicketDetails();
    } catch (err) {
      console.error('Failed to update ticket', err);
      setError(err.response?.data?.message || err.message || 'Unable to save ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomerClick = async () => {
    setIsCustomerEditMode(true);
    try {
      const res = await api.get('/users');
      setCustomerOptions(Array.isArray(res.data) ? res.data : (res.data?.data || []));
      const current = (Array.isArray(res.data) ? res.data : (res.data?.data || [])).find(u => u.userId === ticket?.userRefNo || String(u.userId) === String(ticket?.userRefNo));
      setSelectedCustomer(current || null);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    }
  };

  const handleSaveCustomer = async () => {
    try {
      setLoading(true);
      const updatedTicket = {
        ...ticket,
        userRefNo: selectedCustomer ? String(selectedCustomer.userId) : ticket?.userRefNo,
      };
      await api.put(`/tickets/${id}`, updatedTicket);
      setIsCustomerEditMode(false);
      await loadTicketDetails();
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: { message: 'Customer linked successfully!', severity: 'success' }
      }));
    } catch (err) {
      console.error('Failed to update customer', err);
      setError(err.response?.data?.message || 'Unable to update customer');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDeviceClick = async () => {
    setIsDeviceEditMode(true);
    try {
      // Fetch device types, brands, models
      const [deviceTypesRes, brandsRes, modelsRes] = await Promise.all([
        api.get('/devicetypes'),
        api.get('/brands'),
        api.get('/devicemodels')
      ]);
      
      const loadedDeviceTypes = deviceTypesRes.data;
      const loadedBrands = brandsRes.data;
      const loadedModels = modelsRes.data;

      setDeviceTypes(loadedDeviceTypes);
      setBrands(loadedBrands);
      setModels(loadedModels);

      // Match names to find initial IDs
      const initialDeviceType = loadedDeviceTypes.find(dt => dt.deviceTypeName === ticket?.deviceTypeName);
      const initialBrand = loadedBrands.find(b => b.brandName === ticket?.deviceBrandName);
      const initialModel = loadedModels.find(m => m.modelName === ticket?.deviceModelName);

      const deviceTypeId = initialDeviceType ? initialDeviceType.deviceTypeId : '';
      const brandId = initialBrand ? initialBrand.brandId : '';
      const modelId = initialModel ? initialModel.modelId : '';
      const serialNo = ticket?.deviceSerialNo || '';
      const warrantyType = ticket?.warrantyType || '';

      setEditDeviceForm({
        deviceTypeId,
        brandId,
        modelId,
        serialNo,
        warrantyType,
        customModelName: '',
      });

      // Filter brands based on deviceTypeId
      if (deviceTypeId) {
        const selectedDeviceType = loadedDeviceTypes.find(dt => dt.deviceTypeId === deviceTypeId);
        if (selectedDeviceType) {
          const filtered = loadedBrands.filter(b => b.deviceTypeName === selectedDeviceType.deviceTypeName);
          setFilteredBrands(filtered.length > 0 ? filtered : loadedBrands);
        } else {
          setFilteredBrands(loadedBrands);
        }
      } else {
        setFilteredBrands([]);
      }

      // Filter models based on brandId
      if (brandId) {
        const selectedBrand = loadedBrands.find(b => b.brandId === brandId);
        if (selectedBrand) {
          const filtered = loadedModels.filter(m => m.brandName === selectedBrand.brandName);
          setFilteredModels(filtered.length > 0 ? filtered : loadedModels);
        } else {
          setFilteredModels(loadedModels);
        }
      } else {
        setFilteredModels([]);
      }

    } catch (err) {
      console.error('Failed to load device details for editing', err);
      setError('Unable to load device metadata');
    }
  };

  const handleDeviceTypeChange = (e) => {
    const deviceTypeId = e.target.value;
    setEditDeviceForm(prev => ({ ...prev, deviceTypeId, brandId: '', modelId: '' }));
    
    const selectedDeviceType = deviceTypes.find(dt => dt.deviceTypeId === deviceTypeId);
    if (selectedDeviceType) {
      const filtered = brands.filter(b => b.deviceTypeName === selectedDeviceType.deviceTypeName);
      setFilteredBrands(filtered.length > 0 ? filtered : brands);
    } else {
      setFilteredBrands(brands);
    }
    setFilteredModels([]);
  };

  const handleBrandChange = (e) => {
    const brandId = e.target.value;
    setEditDeviceForm(prev => ({ ...prev, brandId, modelId: '' }));

    const selectedBrand = brands.find(b => b.brandId === brandId);
    if (selectedBrand) {
      const filtered = models.filter(m => m.brandName === selectedBrand.brandName);
      setFilteredModels(filtered.length > 0 ? filtered : models);
    } else {
      setFilteredModels(models);
    }
  };

  const handleDeviceFieldChange = (field) => (e) => {
    setEditDeviceForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSaveDevice = async () => {
    try {
      setLoading(true);
      setError('');
      
      const updatedTicket = {
        ...ticket,
        deviceSerialNo: editDeviceForm.serialNo,
        deviceModelId: editDeviceForm.modelId || null,
        customModelName: editDeviceForm.customModelName || null,
        brandId: editDeviceForm.brandId || null,
        warrantyType: editDeviceForm.warrantyType || null,
      };

      await api.put(`/tickets/${id}`, updatedTicket);
      setIsDeviceEditMode(false);
      await loadTicketDetails();
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: { message: 'Device details updated successfully!', severity: 'success' }
      }));
    } catch (err) {
      console.error('Failed to update device details', err);
      setError(err.response?.data?.message || 'Unable to update device details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDescriptionClick = () => {
    setTempDescription(ticket?.ticketDescription || '');
    setIsDescriptionEditMode(true);
  };

  const handleSaveDescription = async () => {
    try {
      setLoading(true);
      setError('');
      const updatedTicket = {
        ...ticket,
        ticketDescription: tempDescription,
      };
      await api.put(`/tickets/${id}`, updatedTicket);
      setIsDescriptionEditMode(false);
      await loadTicketDetails();
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: { message: 'Description updated successfully!', severity: 'success' }
      }));
    } catch (err) {
      console.error('Failed to update description', err);
      setError(err.response?.data?.message || 'Unable to update description');
    } finally {
      setLoading(false);
    }
  };

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5,
  };

  const valueOrNA = (value) => {
    if (value === undefined || value === null || value === '') {
      return 'Not available';
    }

    return String(value);
  };

  const statusDisplay = valueOrNA(ticket?.ticketStatusName || ticket?.status || 'Open');
  let statusChipColor = 'default';
  if (statusDisplay.toUpperCase() === 'CLOSED' || statusDisplay.toUpperCase() === 'RESOLVED') statusChipColor = 'success';
  else if (statusDisplay.toUpperCase() === 'IN PROGRESS') statusChipColor = 'info';
  else if (statusDisplay.toUpperCase() === 'OPEN') statusChipColor = 'warning';
  else if (statusDisplay.toUpperCase() === 'CRITICAL') statusChipColor = 'error';

  const customerName = [ticket?.userFirstName, ticket?.userLastName]
    .filter(Boolean)
    .join(' ');

  const customerInitials = customerName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'NA';

  const brand = valueOrNA(ticket?.deviceBrandName);
  const model = valueOrNA(ticket?.deviceModelName);
  const deviceName = ticket?.deviceModelName || 'Not available';

  const ticketCode = ticket?.ticketId ? `TK-${ticket.ticketId}` : 'Not available';
  const ticketTitle = deviceName !== 'Not available' ? `${deviceName}` : 'Ticket details';
  const issueDescription = valueOrNA(ticket?.ticketDescription);
  const customerEmail = valueOrNA(ticket?.emailId);
  const customerPhone = valueOrNA(ticket?.userMobileNo);
  const assignedTo = valueOrNA(ticket?.employeeName);
  const department = valueOrNA(ticket?.departmentName);
  const ticketType = valueOrNA(ticket?.ticketTypeName);
  const branch = valueOrNA(ticket?.branchName);
  const serialNo = valueOrNA(ticket?.deviceSerialNo);
  const warranty = valueOrNA(ticket?.warrantyType);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <IconButton size="small" onClick={() => navigate(-1)} sx={{ color: theme.palette.text.secondary }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography sx={{ fontSize: '11px', fontWeight: 600, color: theme.palette.text.secondary, letterSpacing: '0.04em' }}>
          MAIN WORKSHOP (TERMINAL A-12)
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
          {loading ? 'Loading ticket details…' : ticketTitle}
        </Typography>
        <Chip
          label={ticketCode}
          size="small"
          sx={{ fontWeight: 600, borderRadius: '2px', bgcolor: `${theme.palette.primary.main}14`, color: theme.palette.primary.main, height: 22 }}
        />
        <Chip
          label={statusDisplay.toUpperCase()}
          size="small"
          color={statusChipColor}
          sx={{ fontWeight: 600, borderRadius: '2px', height: 22 }}
        />
      </Box>

      {error && (
        <Typography sx={{ fontSize: '13px', color: 'error.main', mt: 1, mb: 2 }}>
          {error}
        </Typography>
      )}

      {!isNormalUser && (
        <Box sx={{ display: 'flex', justifyContent:'flex-end', gap: 1.5, mb: 3 }}>
          <Button variant="outlined" color="primary" size="small" sx={{ fontSize: '12px' }} onClick={() => navigate(`/billing/create?ticketId=${id}`)}>Billing Details</Button>
          {!isEditMode ? (
            <Button variant="outlined" size="small" startIcon={<EditOutlinedIcon />} sx={{ fontSize: '12px' }} onClick={handleEditClick}>Edit</Button>
          ) : (
            <>
              <Button variant="text" size="small" sx={{ fontSize: '12px' }} onClick={() => setIsEditMode(false)} disabled={loading}>Cancel</Button>
              <Button variant="contained" size="small" startIcon={<SaveOutlinedIcon />} sx={{ fontSize: '12px' }} onClick={handleSaveClick} disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </Box>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={isNormalUser ? 0 : 2.5}>
        {/* Left Column */}
        <Box sx={{ flex: isNormalUser ? 1 : 0.7 }}>
          {/* Issue Description */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{ px: 2.5, py: 1.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Issue Description</Typography>
              {!isDescriptionEditMode ? (
                <Button size="small" variant="text" sx={{ fontSize: '11px', minWidth: 0, p: '2px 6px' }} onClick={handleEditDescriptionClick}>Edit</Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" variant="text" sx={{ fontSize: '11px', minWidth: 0, p: '2px 6px' }} onClick={() => setIsDescriptionEditMode(false)}>Cancel</Button>
                  <Button size="small" variant="contained" sx={{ fontSize: '11px', minWidth: 0, p: '2px 6px' }} onClick={handleSaveDescription}>Save</Button>
                </Box>
              )}
            </Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              {isDescriptionEditMode ? (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                />
              ) : (
                <Box sx={{ bgcolor: theme.palette.background.default, borderRadius: '3px', border: `1px solid ${theme.palette.divider}`, p: 2, borderLeft: `3px solid ${theme.palette.primary.main}` }}>
                  <Typography sx={{ fontSize: '13px', color: theme.palette.text.primary, lineHeight: 1.7, fontStyle: issueDescription === 'Not available' ? 'normal' : 'italic' }}>
                    {issueDescription}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          <Stack direction="row" spacing={2.5} flexWrap="wrap" useFlexGap>
            {/* Customer Information */}
            <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5,  width: '50%' }}>
              <Box sx={{ px: 2.5, py: 1.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonOutlinedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Customer Information</Typography>
                </Box>
                {!isNormalUser && (
                  !isCustomerEditMode ? (
                    <Button size="small" variant="text" sx={{ fontSize: '11px', minWidth: 0, p: '2px 6px' }} onClick={handleEditCustomerClick}>Edit</Button>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="text" sx={{ fontSize: '11px', minWidth: 0, p: '2px 6px' }} onClick={() => setIsCustomerEditMode(false)}>Cancel</Button>
                      <Button size="small" variant="contained" sx={{ fontSize: '11px', minWidth: 0, p: '2px 6px' }} onClick={handleSaveCustomer}>Save</Button>
                    </Box>
                  )
                )}
              </Box>
              <Divider />
              <Box sx={{ p: 2.5 }}>
                {isCustomerEditMode ? (
                  <Box sx={{ mb: 2 }}>
                    <Autocomplete
                      options={customerOptions}
                      getOptionLabel={(option) => `${option.firstName || ''} ${option.lastName || ''} - ${option.mobileNo || option.emailId || ''}`}
                      value={selectedCustomer}
                      onChange={(e, newValue) => setSelectedCustomer(newValue)}
                      renderInput={(params) => <TextField {...params} label="Search Customer" size="small" sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }} />}
                    />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: theme.palette.primary.main, fontSize: '0.85rem', fontWeight: 700 }}>{customerInitials}</Avatar>
                    <Box>
                      <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>{valueOrNA(customerName)}</Typography>
                      <Chip label="Professional Client" size="small" sx={{ fontSize: '10px', height: 18, borderRadius: '2px', bgcolor: `${theme.palette.secondary.main}14`, color: theme.palette.secondary.main }} />
                    </Box>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                  {[['Email', isCustomerEditMode ? (selectedCustomer?.emailId || 'Not available') : customerEmail], 
                    ['Phone', isCustomerEditMode ? (selectedCustomer?.mobileNo || 'Not available') : customerPhone], 
                    ['Branch', branch]].map(([l, v]) => (
                    <Box key={l} sx={{ mb: 1.2 }}>
                      <Typography sx={lbl}>{l}</Typography>
                      <Typography sx={{ fontSize: '13px' }}>{v}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Paper>

            {/* Device Details */}
            <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5, width: '50%' }}>
              <Box sx={{ px: 2.5, py: 1.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LaptopMacIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Device Details</Typography>
                </Box>
                {!isDeviceEditMode ? (
                  <Button size="small" variant="text" sx={{ fontSize: '11px', minWidth: 0, p: '2px 6px' }} onClick={handleEditDeviceClick}>Edit</Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="text" sx={{ fontSize: '11px', minWidth: 0, p: '2px 6px' }} onClick={() => setIsDeviceEditMode(false)}>Cancel</Button>
                    <Button size="small" variant="contained" sx={{ fontSize: '11px', minWidth: 0, p: '2px 6px' }} onClick={handleSaveDevice}>Save</Button>
                  </Box>
                )}
              </Box>
              <Divider />
              <Box sx={{ p: 2.5 }}>
                {isDeviceEditMode ? (
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={lbl}>Device Type</Typography>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={editDeviceForm.deviceTypeId}
                          onChange={handleDeviceTypeChange}
                          displayEmpty
                          sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                        >
                          <MenuItem value="" disabled>Select type…</MenuItem>
                          {deviceTypes.map((t) => (
                            <MenuItem key={t.deviceTypeId} value={t.deviceTypeId}>{t.deviceTypeName}</MenuItem>
                          ))}
                        </TextField>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={lbl}>Brand</Typography>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={editDeviceForm.brandId}
                          onChange={handleBrandChange}
                          disabled={!editDeviceForm.deviceTypeId || filteredBrands.length === 0}
                          displayEmpty
                          sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                        >
                          <MenuItem value="" disabled>Select brand…</MenuItem>
                          {filteredBrands.map((b) => (
                            <MenuItem key={b.brandId} value={b.brandId}>{b.brandName}</MenuItem>
                          ))}
                        </TextField>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={lbl}>Model</Typography>
                        <Autocomplete
                          freeSolo
                          options={filteredModels}
                          getOptionLabel={(option) => {
                            if (typeof option === 'string') {
                              return option;
                            }
                            return option.modelName || '';
                          }}
                          value={
                            filteredModels.find(m => String(m.modelId) === String(editDeviceForm.modelId)) || 
                            editDeviceForm.customModelName || 
                            ''
                          }
                          onChange={(e, newValue) => {
                            if (typeof newValue === 'string') {
                              setEditDeviceForm(prev => ({
                                ...prev,
                                modelId: '',
                                customModelName: newValue
                              }));
                            } else if (newValue && newValue.modelId) {
                              setEditDeviceForm(prev => ({
                                ...prev,
                                modelId: newValue.modelId,
                                customModelName: ''
                              }));
                            } else {
                              setEditDeviceForm(prev => ({
                                ...prev,
                                modelId: '',
                                customModelName: ''
                              }));
                            }
                          }}
                          onInputChange={(e, newInputValue) => {
                            const matchingOption = filteredModels.find(
                              m => m.modelName.toLowerCase() === newInputValue.toLowerCase()
                            );
                            if (matchingOption) {
                              setEditDeviceForm(prev => ({
                                ...prev,
                                modelId: matchingOption.modelId,
                                customModelName: ''
                              }));
                            } else {
                              setEditDeviceForm(prev => ({
                                ...prev,
                                modelId: '',
                                customModelName: newInputValue
                              }));
                            }
                          }}
                          disabled={!editDeviceForm.brandId}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Select or type model…"
                              size="small"
                              sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                            />
                          )}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={lbl}>Serial Number</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="S/N"
                          value={editDeviceForm.serialNo}
                          onChange={handleDeviceFieldChange('serialNo')}
                          sx={{ '& .MuiOutlinedInput-root': { fontFamily: '"JetBrains Mono", monospace', fontSize: '13px' } }}
                        />
                      </Box>
                    </Box>
                    <Box>
                      <Typography sx={lbl}>Warranty Type</Typography>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={editDeviceForm.warrantyType}
                        onChange={handleDeviceFieldChange('warrantyType')}
                        displayEmpty
                        sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                      >
                        <MenuItem value="" disabled>Select…</MenuItem>
                        {['Warranty', 'RMA', 'Out-of-Warranty', 'Internal'].map((t) => (
                          <MenuItem key={t} value={t}>{t}</MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  </Stack>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    {[['Brand', brand], 
                      ['Model', model], 
                      ['Serial No.', serialNo], 
                      ['Warranty', warranty], 
                      ['Type', ticketType]].map(([l, v]) => (
                      <Box key={l} sx={{ mb: 1.2, width: '33.33%' }}>
                        <Typography sx={lbl}>{l}</Typography>
                        <Typography sx={{ fontSize: '13px', fontFamily: l === 'Serial No.' ? '"JetBrains Mono", monospace' : 'inherit' }}>{v}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Paper>
          </Stack>

          {/* Attachments */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{ px: 2.5, py: 1.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Attachments ({attachments.length})</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  hidden
                  onChange={handleAttachmentUpload}
                />
                <Button
                  size="small"
                  sx={{ fontSize: '12px' }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading…' : 'Upload'}
                </Button>
              </Box>
            </Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              {uploadMessage && (
                <Typography sx={{ fontSize: '12px', color: 'success.main', mb: 1.5 }}>
                  {uploadMessage}
                </Typography>
              )}
              {attachments.length === 0 ? (
                <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
                  No attachments available for this ticket.
                </Typography>
              ) : (
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                  {attachments.map((attachment) => {
                    const isImage = /\.(jpe?g|png|gif|bmp|webp)$/i.test(attachment.fileName || '');
                    return (
                      <Box
                        key={attachment.attachmentId || attachment.fileName}
                        component={isImage && attachment.fileUrl ? 'div' : 'a'}
                        href={!isImage ? (attachment.fileUrl || '#') : undefined}
                        target={!isImage ? '_blank' : undefined}
                        rel={!isImage ? 'noreferrer' : undefined}
                        sx={{
                          width: 150,
                          minHeight: 140,
                          borderRadius: '6px',
                          bgcolor: theme.palette.background.default,
                          border: `1.5px solid ${theme.palette.divider}`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: isImage && attachment.fileUrl ? 'zoom-in' : (attachment.fileUrl ? 'pointer' : 'default'),
                          textDecoration: 'none',
                          px: 1.5,
                          py: 1.5,
                          boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)',
                          transition: 'box-shadow 0.18s, border-color 0.18s',
                          '&:hover': attachment.fileUrl ? { borderColor: theme.palette.primary.main, boxShadow: '0 4px 16px 0 rgba(0,82,204,0.10)' } : undefined,
                        }}
                        onClick={isImage && attachment.fileUrl ? () => { setLightboxImg({ url: attachment.fileUrl, name: attachment.fileName }); setLightboxOpen(true); } : undefined}
                      >
                        {isImage && attachment.fileUrl ? (
                          <Box
                            component="img"
                            src={attachment.fileUrl}
                            alt={attachment.fileName || 'Attachment'}
                            sx={{
                              width: 90,
                              height: 90,
                              objectFit: 'cover',
                              borderRadius: '4px',
                              mb: 1,
                              background: theme.palette.background.paper,
                              border: `1px solid ${theme.palette.divider}`,
                              boxShadow: '0 1px 6px 0 rgba(0,0,0,0.08)',
                            }}
                          />
                        ) : (
                          <ImageOutlinedIcon sx={{ fontSize: 36, color: theme.palette.divider, mb: 1 }} />
                        )}
                        <Typography sx={{ fontSize: '12px', color: theme.palette.text.primary, textAlign: 'center', fontWeight: 600, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {attachment.fileName || 'Attachment'}
                        </Typography>
                        <Typography sx={{ fontSize: '10px', color: theme.palette.text.secondary, textAlign: 'center', mt: 0.5 }}>
                          {formatTimestamp(attachment.uploadedAt)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>
          </Paper>

        </Box>

        {/* Right Column */}
        {!isNormalUser && (
          <Box sx={{ flex: 0.3}}>

          {/* Post Internal Update (Only for Staff) */}
          {!isNormalUser && (
            <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
              <Box sx={{ px: 2.5, py: 1.8 }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Post Internal Update</Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 2.5 }}>
                <TextField 
                  fullWidth 
                  multiline 
                  rows={3} 
                  placeholder="Add an internal note or status update…" 
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  disabled={!isEditMode}
                  sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }} 
                />
              </Box>
            </Paper>
          )}

          {/* Operations (Only for Staff) */}
          {!isNormalUser && (
            <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
              <Box sx={{ px: 2.5, py: 1.8 }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Operations</Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 2.5 }}>
                <Stack spacing={2} sx={{ mb: 2.5 }}>
                  <Box>
                    <Typography sx={lbl}>Department</Typography>
                    {isEditMode ? (
                      <TextField 
                        select 
                        fullWidth 
                        size="small" 
                        value={editForm.departmentId} 
                        onChange={(e) => setEditForm({...editForm, departmentId: e.target.value, employeeId: ''})} 
                        sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                      >
                        <MenuItem value="">Unassigned</MenuItem>
                        {departments.map(dep => <MenuItem key={dep.departmentId || dep.id} value={dep.departmentId || dep.id}>{dep.departmentName || dep.name}</MenuItem>)}
                      </TextField>
                    ) : (
                      <Typography sx={{ fontSize: '13px' }}>{department}</Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography sx={lbl}>Assigned To</Typography>
                    {isEditMode ? (
                      <TextField 
                        select 
                        fullWidth 
                        size="small" 
                        value={editForm.employeeId} 
                        onChange={(e) => setEditForm({...editForm, employeeId: e.target.value})} 
                        sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                        disabled={!editForm.departmentId}
                      >
                        <MenuItem value="">Unassigned</MenuItem>
                        {employees.map(emp => <MenuItem key={emp.employeeId || emp.id} value={emp.employeeId || emp.id}>{emp.employeeName || emp.name}</MenuItem>)}
                      </TextField>
                    ) : (
                      <Typography sx={{ fontSize: '13px' }}>{assignedTo}</Typography>
                    )}
                  </Box>
                  
                  <Box>
                    <Typography sx={lbl}>Status</Typography>
                    {isEditMode ? (
                      <TextField 
                        select 
                        fullWidth 
                        size="small" 
                        value={editForm.ticketStatusId} 
                        onChange={(e) => setEditForm({...editForm, ticketStatusId: e.target.value})} 
                        sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                      >
                        {statuses.map(s => <MenuItem key={s.statusId || s.id} value={s.statusId || s.id}>{s.statusName || s.name}</MenuItem>)}
                      </TextField>
                    ) : (
                      <Typography sx={{ fontSize: '13px' }}>{statusDisplay}</Typography>
                    )}
                  </Box>
                </Stack>
              </Box>
            </Paper>
          )}

           {/* Activity Timeline */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.8 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Activity Timeline</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              {timeline.length === 0 ? (
                <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
                  No activity available for this ticket yet.
                </Typography>
              ) : (
                timeline.map((entry, i) => (
                  <Box key={`${entry.user}-${entry.timestamp}-${i}`} sx={{ display: 'flex', gap: 1.5, mb: i < timeline.length - 1 ? 2.5 : 0, position: 'relative' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.3 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.type === 'system' ? theme.palette.text.secondary : theme.palette.primary.main, flexShrink: 0 }} />
                      {i < timeline.length - 1 && <Box sx={{ width: 1, flex: 1, bgcolor: theme.palette.divider, mt: 0.5 }} />}
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>
                        <Box component="span" sx={{ fontWeight: 600 }}>{entry.user}</Box>{' — '}{entry.action}
                      </Typography>
                      <Typography sx={{ fontSize: '11px', color: theme.palette.text.secondary, mt: 0.3 }}>{entry.timestamp}</Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Box>
        )}
      </Stack>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth="md" fullWidth>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
          {lightboxImg && (
            <>
              <Box
                component="img"
                src={lightboxImg.url}
                alt={lightboxImg.name || 'Preview'}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  borderRadius: '8px',
                  boxShadow: '0 2px 16px 0 rgba(0,0,0,0.18)',
                  mb: 2,
                }}
              />
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.text.primary, textAlign: 'center', mb: 1 }}>
                {lightboxImg.name}
              </Typography>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}