import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Box, Paper, Typography, TextField, Button, Divider,
  MenuItem, Stack, Autocomplete
} from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
 
const PRIORITIES = ['Low', 'Normal', 'High', 'Critical'];
const WARRANTY_TYPES = ['Warranty', 'RMA', 'Out-of-Warranty', 'Internal'];

export default function NewTicketPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  const rawRole = user?.roles?.[0]?.authority || user?.role || 'ROLE_USER';
  const isNormalUser = rawRole === 'ROLE_USER';

  // API Data State
  const [customers, setCustomers] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [meData, setMeData] = useState(null);

  // Form State
  const [form, setForm] = useState({
    customerId: '',
    phone: '',
    email: '',
    customerType: 'Walk-in',
    brandId: '',
    modelId: '',
    customModelName: '',
    serialNumber: '',
    deviceTypeId: '',
    priority: 'Normal',
    ticketTypeId: '',
    warrantyType: '',
    issueTitle: '',
    issueDescription: '',
  });

  // Generic change handler for simple fields
  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // Fetch logged in profile details if normal user
  useEffect(() => {
    const fetchMeData = async () => {
      if (isNormalUser) {
        try {
          const res = await api.get('/auth/me');
          setMeData(res.data);
          setForm((prev) => ({
            ...prev,
            customerId: res.data.userId,
            phone: res.data.mobileNo || '',
            email: res.data.emailId || '',
          }));
        } catch (error) {
          console.error("Failed to fetch user profile", error);
        }
      }
    };
    fetchMeData();
  }, [isNormalUser]);

  // Fetch initial data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (isNormalUser) {
          // Customers (ROLE_USER) don't call manager-restricted `/users` endpoint
          const [deviceTypesRes, ticketTypesRes] = await Promise.all([
            api.get('/devicetypes'),
            api.get('/ticket-types'),
          ]);
          setDeviceTypes(deviceTypesRes.data);
          setTicketTypes(ticketTypesRes.data);
        } else {
          const [customersRes, deviceTypesRes, ticketTypesRes] = await Promise.all([
            api.get('/users'),
            api.get('/devicetypes'),
            api.get('/ticket-types'),
          ]);
          setCustomers(customersRes.data);
          setDeviceTypes(deviceTypesRes.data);
          setTicketTypes(ticketTypesRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      }
    };
    fetchInitialData();
  }, [isNormalUser]);

  // Effect for cascading device type -> brands
  useEffect(() => {
    if (form.deviceTypeId) {
      const fetchBrands = async () => {
        try {
          const res = await api.get('/brands');
          const selectedDeviceType = deviceTypes.find(dt => dt.deviceTypeId === form.deviceTypeId);
          if (selectedDeviceType) {
            const filteredBrands = res.data.filter(b => b.deviceTypeName === selectedDeviceType.deviceTypeName);
            setBrands(filteredBrands.length > 0 ? filteredBrands : res.data);
          } else {
            setBrands(res.data);
          }
        } catch (error) {
          console.error("Failed to fetch brands", error);
          setBrands([]);
        }
      };
      fetchBrands();
    } else {
      setBrands([]);
    }
  }, [form.deviceTypeId, deviceTypes]);

  // Effect for cascading brand -> models
  useEffect(() => {
    if (form.brandId) {
      const fetchModels = async () => {
        try {
          const res = await api.get('/devicemodels');
          const selectedBrand = brands.find(b => b.brandId === form.brandId);
          if (selectedBrand) {
            const filteredModels = res.data.filter(m => m.brandName === selectedBrand.brandName);
            setModels(filteredModels.length > 0 ? filteredModels : res.data);
          } else {
            setModels(res.data);
          }
        } catch (error) {
          console.error("Failed to fetch models", error);
          setModels([]);
        }
      };
      fetchModels();
    } else {
      setModels([]);
    }
  }, [form.brandId, brands]);

  // Effect to auto-populate customer info (Only for staff choosing a customer)
  useEffect(() => {
    if (form.customerId && !isNormalUser) {
      const customer = customers.find((c) => c.userId === form.customerId);
      if (customer) {
        setForm((prev) => ({ ...prev, phone: customer.mobileNo || '', email: customer.emailId || '' }));
      }
    } else if (!isNormalUser) {
      setForm((prev) => ({ ...prev, phone: '', email: '' }));
    }
  }, [form.customerId, customers, isNormalUser]);

  // Specific handlers for cascading dropdowns to reset children
  const handleDeviceTypeChange = (e) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, deviceTypeId: value, brandId: '', modelId: '', customModelName: '' }));
  };

  const handleBrandChange = (e) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, brandId: value, modelId: '', customModelName: '' }));
  };

  const handleCreateTicket = async () => {
    const payload = {
      userRefNo: String(form.customerId),
      ticketTypeId: form.ticketTypeId,
      emailId: form.email,
      deviceSerialNo: form.serialNumber,
      ticketDescription: `${form.issueTitle}: ${form.issueDescription}`,
      warrantyType: form.warrantyType,
      priority: form.priority,
      remarks: `New ticket created for device S/N: ${form.serialNumber}`,
      deviceModelId: form.modelId || null,
      customModelName: form.customModelName || null,
      brandId: form.brandId || null,
      ticketStatusId: 1, // Defaulting to 1 for initial status
    };

    try {
      console.log("Creating ticket with payload:", payload);
      await api.post('/tickets', payload);
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: { message: 'Ticket created successfully!', severity: 'success' }
      }));
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to create ticket:', error);
    }
  };

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.8,
  };

  const secHdr = { px: 2.5, py: 1.8, bgcolor: `${theme.palette.primary.main}06` };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
          {isNormalUser ? 'Submit New Support Request' : 'Intake New Repair Ticket'}
        </Typography>
        <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
          {isNormalUser ? 'Provide details about your device and description of the issue.' : 'Fill in the details below to initialize a service request for a new device.'}
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
        <Box sx={{ flex: 1 }}>
          {/* Customer Details */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
            <Box sx={secHdr}><Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Your Information</Typography></Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <Typography sx={lbl}>Name</Typography>
              {isNormalUser ? (
                <TextField
                  fullWidth
                  size="small"
                  value={meData ? `${meData.firstName} ${meData.lastName}` : 'Loading...'}
                  InputProps={{ readOnly: true }}
                  sx={{ mb: 2 }}
                />
              ) : (
                <TextField fullWidth size="small" select value={form.customerId} onChange={handleChange('customerId')} sx={{ mb: 2 }} displayEmpty>
                  <MenuItem value="" disabled>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                      <PersonOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
                      Select a customer
                    </Box>
                  </MenuItem>
                  {customers.map((c) => <MenuItem key={c.userId} value={c.userId}>{`${c.firstName} ${c.lastName}`}</MenuItem>)}
                </TextField>
              )}
              <Box sx={{ display: 'flex', gap: 2, mb: isNormalUser ? 0 : 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={lbl}>Phone</Typography>
                  <TextField fullWidth size="small" placeholder="+1 (555) 000-0000" value={form.phone} InputProps={{ readOnly: true }}
                    slotProps={{ input: { startAdornment: <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}><PhoneOutlinedIcon fontSize="small" /></Box> } }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={lbl}>Email</Typography>
                  <TextField fullWidth size="small" placeholder="customer@email.com" value={form.email} InputProps={{ readOnly: true }}
                    slotProps={{ input: { startAdornment: <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}><EmailOutlinedIcon fontSize="small" /></Box> } }} />
                </Box>
              </Box>
              {!isNormalUser && (
                <>
                  <Typography sx={lbl}>Customer Type</Typography>
                  <TextField fullWidth size="small" select value={form.customerType} onChange={handleChange('customerType')}>
                    {['Walk-in', 'Professional Client', 'Corporate Account', 'Government'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                </>
              )}
            </Box>
          </Paper>

          {/* Device Information */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden' }}>
            <Box sx={secHdr}><Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Device Information</Typography></Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}><Typography sx={lbl}>Device Type</Typography>
                  <TextField fullWidth size="small" select value={form.deviceTypeId} onChange={handleDeviceTypeChange} displayEmpty>
                    <MenuItem value="" disabled>Select type…</MenuItem>
                    {deviceTypes.map((t) => <MenuItem key={t.deviceTypeId} value={t.deviceTypeId}>{t.deviceTypeName}</MenuItem>)}
                  </TextField></Box>
                <Box sx={{ flex: 1 }}><Typography sx={lbl}>Brand</Typography>
                  <TextField fullWidth size="small" select value={form.brandId} onChange={handleBrandChange} disabled={!form.deviceTypeId || brands.length === 0} displayEmpty>
                    <MenuItem value="" disabled>Select brand…</MenuItem>
                    {brands.map((b) => <MenuItem key={b.brandId} value={b.brandId}>{b.brandName}</MenuItem>)}
                  </TextField></Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}><Typography sx={lbl}>Model</Typography>
                  <Autocomplete
                    freeSolo
                    options={models}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') {
                        return option;
                      }
                      return option.modelName || '';
                    }}
                    value={
                      models.find(m => String(m.modelId) === String(form.modelId)) || 
                      form.customModelName || 
                      ''
                    }
                    onChange={(e, newValue) => {
                      if (typeof newValue === 'string') {
                        setForm(prev => ({
                          ...prev,
                          modelId: '',
                          customModelName: newValue
                        }));
                      } else if (newValue && newValue.modelId) {
                        setForm(prev => ({
                          ...prev,
                          modelId: newValue.modelId,
                          customModelName: ''
                        }));
                      } else {
                        setForm(prev => ({
                          ...prev,
                          modelId: '',
                          customModelName: ''
                        }));
                      }
                    }}
                    onInputChange={(e, newInputValue) => {
                      const matchingOption = models.find(
                        m => m.modelName.toLowerCase() === newInputValue.toLowerCase()
                      );
                      if (matchingOption) {
                        setForm(prev => ({
                          ...prev,
                          modelId: matchingOption.modelId,
                          customModelName: ''
                        }));
                      } else {
                        setForm(prev => ({
                          ...prev,
                          modelId: '',
                          customModelName: newInputValue
                        }));
                      }
                    }}
                    disabled={!form.brandId}
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
                <Box sx={{ flex: 1 }}><Typography sx={lbl}>Serial Number</Typography>
                  <TextField fullWidth size="small" placeholder="S/N" value={form.serialNumber} onChange={handleChange('serialNumber')}
                    sx={{ '& .MuiOutlinedInput-root': { fontFamily: '"JetBrains Mono", monospace', fontSize: '13px' } }} /></Box>
              </Box>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ flex: 1 }}>
          {/* Issue Description */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
            <Box sx={secHdr}><Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Issue Description</Typography></Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}><Typography sx={lbl}>Priority</Typography>
                  <TextField fullWidth size="small" select value={form.priority} onChange={handleChange('priority')}>
                    {PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                  </TextField></Box>
                <Box sx={{ flex: 1 }}><Typography sx={lbl}>Warranty Type</Typography>
                  <TextField fullWidth size="small" select value={form.warrantyType} onChange={handleChange('warrantyType')} displayEmpty>
                    <MenuItem value="" disabled>Select…</MenuItem>
                    {WARRANTY_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField></Box>
              </Box>
              <Typography sx={lbl}>Ticket Type</Typography>
              <TextField fullWidth size="small" select value={form.ticketTypeId} onChange={handleChange('ticketTypeId')} sx={{ mb: 2 }} displayEmpty>
                <MenuItem value="" disabled>Select type…</MenuItem>
                {ticketTypes.map((t) => <MenuItem key={t.ticketTypeId} value={t.ticketTypeId}>{t.ticketTypeName}</MenuItem>)}
              </TextField>
              <Typography sx={lbl}>Issue Title</Typography>
              <TextField fullWidth size="small" placeholder="Brief summary" value={form.issueTitle}
                onChange={handleChange('issueTitle')} sx={{ mb: 2 }} />
              <Typography sx={lbl}>Description</Typography>
              <TextField fullWidth multiline rows={5} placeholder="Detailed description of the issue…"
                value={form.issueDescription} onChange={handleChange('issueDescription')}
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }} />
            </Box>
          </Paper>
          {/* Upload */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
            <Box sx={secHdr}><Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Upload Attachments</Typography></Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <Box sx={{ border: `2px dashed ${theme.palette.divider}`, borderRadius: '3px', p: 4, textAlign: 'center',
                cursor: 'pointer', transition: 'border-color 0.2s', '&:hover': { borderColor: theme.palette.primary.main } }}>
                <CloudUploadOutlinedIcon sx={{ fontSize: 40, color: theme.palette.text.secondary, mb: 1 }} />
                <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>Drop device photos, warranty PDFs, or invoices here.</Typography>
                <Typography sx={{ fontSize: '11px', color: theme.palette.text.secondary, mt: 0.5 }}>JPG, PNG, PDF up to 10MB each</Typography>
              </Box>
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button variant="outlined" startIcon={<CloseIcon />} onClick={() => navigate('/dashboard')} sx={{ px: 3 }}>Cancel</Button>
            <Button variant="contained" startIcon={<SaveOutlinedIcon />} sx={{ px: 3 }} onClick={handleCreateTicket}>Create Request</Button>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
