import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box, Paper, Typography, TextField, Button, Divider,
  MenuItem, Stack, Autocomplete
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalLoading } from '../../contexts/GlobalLoadingContext';
import ChargeDetails from '../Billing/components/ChargeDetails';
import CustomerDetails from './NEWTicketCOmponents/CustomerDetails';
import DeviceInformation from './NEWTicketCOmponents/DeviceInformation';
import IssueDescription from './NEWTicketCOmponents/IssueDescription';
import TicketAssignment from './NEWTicketCOmponents/TicketAssignment';
import UploadAttachments from './NEWTicketCOmponents/UploadAttachments';
import TicketAccessoriesChecklist from './NEWTicketCOmponents/TicketAccessoriesChecklist';
const PRIORITIES = ['Low', 'Normal', 'High', 'Critical'];
const WARRANTY_TYPES = ['Warranty', 'RMA', 'Out-of-Warranty', 'Internal'];

const defaultLineItem = () => ({
  id: crypto.randomUUID(),
  chargeTypeId: '',
  productId: '',
  serviceChargeId: '',
  statusId: '',
  amount: 0,
});

export default function NewTicketPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showLoading, hideLoading } = useGlobalLoading();

  const rawRole = user?.roles?.[0]?.authority || user?.role || 'ROLE_USER';
  const isNormalUser = rawRole === 'ROLE_USER';

  // --- 1. Form State ---
  const [form, setForm] = useState({
    customerId: '',
    customCustomerName: '',
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
    departmentId: '',
    employeeId: '',
    ticketStatusId: 1, // Defaulting to Open or initial status
    targetDate: '',
  });

  const [selectedAccessories, setSelectedAccessories] = useState([]);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // --- 2. React Query Fetches (Ticket Data) ---
  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/auth/me')).data,
    enabled: isNormalUser,
  });

  const { data: deviceTypes = [] } = useQuery({
    queryKey: ['deviceTypes'],
    queryFn: async () => (await api.get('/devicetypes')).data,
  });

  const { data: ticketTypes = [] } = useQuery({
    queryKey: ['ticketTypes'],
    queryFn: async () => (await api.get('/ticket-types')).data,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data,
    enabled: !isNormalUser,
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => (await api.get('/brands')).data,
    select: (data) => {
      if (!form.deviceTypeId) return [];
      const selectedDeviceType = deviceTypes.find(dt => dt.deviceTypeId === form.deviceTypeId);
      if (selectedDeviceType) {
        return data.filter(b => b.deviceTypeName === selectedDeviceType.deviceTypeName);
      }
      return data;
    },
  });

  const { data: models = [] } = useQuery({
    queryKey: ['models'],
    queryFn: async () => (await api.get('/devicemodels')).data,
    select: (data) => {
      if (!form.brandId) return [];
      const selectedBrand = brands.find(b => b.brandId === form.brandId);
      if (selectedBrand) {
        return data.filter(m => m.brandName === selectedBrand.brandName);
      }
      return data;
    },
  });

  // --- 3. React Query Fetches (Billing Lookups) ---
  const { data: chargeTypes = [] } = useQuery({
    queryKey: ['chargeTypes'],
    queryFn: async () => (await api.get('/charge-types')).data?.data || (await api.get('/charge-types')).data || [],
  });
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get('/inventory')).data?.data || (await api.get('/inventory')).data || [],
  });
  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => (await api.get('/service-charges')).data?.data || (await api.get('/service-charges')).data || [],
  });
  const { data: billingStatuses = [] } = useQuery({
    queryKey: ['statuses'],
    queryFn: async () => {
      const res = await api.get('/statuses');
      return res.data?.data || res.data || [];
    },
    select: (data) => data.filter(s => s.statusType === 'Billing' || s.statusType === 'BILLING')
  });
  const { data: paymentModes = [] } = useQuery({
    queryKey: ['paymentModes'],
    queryFn: async () => {
      const res = await api.get('/payment-modes');
      const data = res.data?.data || res.data || [];
      return data.map((pm, idx) => ({ ...pm, id: pm.payModeId || `fallback-pm-${idx}` }));
    },
  });

  // --- 4. Billing Items State & Handlers ---
  const [items, setItems] = useState([]);

  const updateItemBatch = useCallback((id, updatedFields) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updatedFields } : item));
  }, []);

  const getNewItemTemplate = () => {
    const pendingStatus = billingStatuses.find(s => s.statusName?.toLowerCase() === 'pending');
    return { ...defaultLineItem(), statusId: pendingStatus ? pendingStatus.statusId : '' };
  };

  const addNewItem = (newItem) => {
    setItems(prev => [...prev, newItem]);
  };
  
  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const getChargeTypeInfo = (chargeTypeId) => {
    const ct = chargeTypes.find(c => c.chargeTypeId === chargeTypeId);
    if (!ct) return { isProduct: false, isService: false };
    const name = (ct.chargeName || '').toLowerCase();
    const isProduct = name.includes('product');
    const isService = name.includes('service');
    return { isProduct, isService };
  };

  // --- 5. Effects ---
  // Populate meData once loaded
  useEffect(() => {
    if (meData && isNormalUser) {
      setForm((prev) => ({
        ...prev,
        customerId: meData.userId,
        phone: meData.mobileNo || '',
        email: meData.emailId || '',
      }));
    }
  }, [meData, isNormalUser]);

  // Auto-populate customer info (Only for staff choosing a customer)
  useEffect(() => {
    if (form.customerId && !isNormalUser && customers.length > 0) {
      const customer = customers.find((c) => String(c.userId) === String(form.customerId));
      if (customer) {
        setForm((prev) => ({ ...prev, phone: customer.mobileNo || '', email: customer.emailId || '' }));
      }
    } else if (!isNormalUser && !form.customCustomerName) {
      setForm((prev) => ({ ...prev, phone: '', email: '' }));
    }
  }, [form.customerId, customers, isNormalUser, form.customCustomerName]);

  // Auto-add Service Charge when Brand is selected
  useEffect(() => {
    if (form.brandId && brands.length > 0 && services.length > 0) {
      const selectedBrand = brands.find(b => b.brandId === form.brandId);
      if (selectedBrand) {
        // Find a matching service charge by brand name
        const matchingService = services.find(s => s.brandName === selectedBrand.brandName);
        if (matchingService) {
          // Check if it's already added to prevent duplicates
          const alreadyAdded = items.some(i => i.serviceChargeId === matchingService.chargeId);
          if (!alreadyAdded) {
            const pendingStatus = billingStatuses.find(s => s.statusName?.toLowerCase() === 'pending');
            const ctService = chargeTypes.find(ct => (ct.chargeName || '').toLowerCase().includes('service'));
            
            setItems(prev => [...prev, {
              ...defaultLineItem(),
              chargeTypeId: ctService ? ctService.chargeTypeId : '',
              serviceChargeId: matchingService.chargeId,
              amount: matchingService.amount || 0,
              statusId: pendingStatus ? pendingStatus.statusId : ''
            }]);
          }
        }
      }
    }
  }, [form.brandId, brands, services, billingStatuses, chargeTypes]);

  const handleDeviceTypeChange = (e) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, deviceTypeId: value, brandId: '', modelId: '', customModelName: '' }));
  };

  const handleBrandChange = (e) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, brandId: value, modelId: '', customModelName: '' }));
  };

  // --- 6. Mutation ---
  const createTicketMutation = useMutation({
    mutationFn: async () => {
      let finalCustomerId = form.customerId;
      
      if (!finalCustomerId && form.customCustomerName && !isNormalUser) {
        const nameParts = form.customCustomerName.trim().split(' ');
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || '';
        const newUserPayload = { firstName, lastName, mobileNo: form.phone, emailId: form.email, password: 'Mays123', isActive: true };
        const userRes = await api.post('/users', newUserPayload);
        finalCustomerId = userRes.data.userId;
      }

      const payload = {
        userRefNo: String(finalCustomerId),
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
        ticketStatusId: form.ticketStatusId || 1, // Use selected status or default
        employeeId: form.employeeId || null,
        targetDate: form.targetDate ? form.targetDate + ':00' : null, // Backend usually expects complete ISO time
      };

      const ticketRes = await api.post('/tickets', payload);
      const newTicketId = ticketRes.data?.data?.ticketId || ticketRes.data?.ticketId;

      if (newTicketId && items.length > 0) {
        const chargesPayload = items.map(i => ({
          chargeTypeId: i.chargeTypeId || null,
          productId: i.productId || null,
          serviceChargeId: i.serviceChargeId || null,
          paymentModeId: i.paymentModeId || null,
          statusId: i.statusId || null,
          amount: i.amount || 0,
        }));
        await api.put(`/billing/ticket/${newTicketId}/charges`, chargesPayload);
      }

      if (newTicketId && selectedAccessories.length > 0) {
        const accPayload = selectedAccessories.map(accId => ({
          ticketId: newTicketId,
          accessoryId: accId
        }));
        await api.post('/ticket-accessories/bulk', accPayload);
      }

      return newTicketId;
    },
    onSuccess: () => {
      hideLoading();
      window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Ticket created successfully!', severity: 'success' }}));
      navigate('/dashboard');
    },
    onError: (error) => {
      hideLoading();
      console.error('Failed to create ticket:', error);
      window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Failed to create ticket or customer', severity: 'error' }}));
    }
  });

  const handleCreateTicket = () => {
    showLoading('Creating Ticket...');
    createTicketMutation.mutate();
  };

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.8,
  };

  const secHdr = { px: 2.5, py: 1.8, bgcolor: `${theme.palette.primary.main}06` };

  return (
    <Box>
      {/* <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
          {isNormalUser ? 'Submit New Support Request' : 'Intake New Repair Ticket'}
        </Typography>
        <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
          {isNormalUser ? 'Provide details about your device and description of the issue.' : 'Fill in the details below to initialize a service request for a new device.'}
        </Typography>
      </Box> */}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
        <Box sx={{ flex: 1 }}>
          <CustomerDetails 
            isNormalUser={isNormalUser} 
            form={form} 
            setForm={setForm} 
            handleChange={handleChange} 
            customers={customers} 
            lbl={lbl} 
            secHdr={secHdr} 
          />

          <DeviceInformation 
            form={form} 
            setForm={setForm} 
            handleChange={handleChange} 
            handleDeviceTypeChange={handleDeviceTypeChange} 
            deviceTypes={deviceTypes} 
            brands={brands} 
            models={models} 
            lbl={lbl} 
            secHdr={secHdr} 
          />

          <UploadAttachments secHdr={secHdr} />

          {/* Ticket Accessories */}
          {form.deviceTypeId && (
            <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
              <Box sx={secHdr}><Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Ticket Accessories</Typography></Box>
              <Divider />
              <TicketAccessoriesChecklist 
                deviceTypeId={form.deviceTypeId} 
                selectedAccessories={selectedAccessories} 
                onChange={setSelectedAccessories} 
              />
            </Paper>
          )}
        </Box>

        <Box sx={{ flex: 1 }}>
          <IssueDescription 
            form={form} 
            handleChange={handleChange} 
            ticketTypes={ticketTypes} 
            lbl={lbl} 
            secHdr={secHdr} 
          />

          {!isNormalUser && (
            <TicketAssignment 
              form={form} 
              setForm={setForm} 
              handleChange={handleChange} 
              lbl={lbl} 
              secHdr={secHdr} 
            />
          )}
        </Box>
      </Stack>
      
      {/* --- Billing Charges --- */}
      {!isNormalUser && (
        <Box sx={{ mt: 1 }}>
          <ChargeDetails 
            items={items} 
            chargeTypes={chargeTypes} 
            products={products} 
            services={services} 
            statuses={billingStatuses}
            paymentModes={paymentModes}
            getNewItemTemplate={getNewItemTemplate}
            addNewItem={addNewItem}
            removeItem={removeItem}
            updateItemBatch={updateItemBatch}
            getChargeTypeInfo={getChargeTypeInfo}
          />
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 4 }}>
        <Button variant="outlined" startIcon={<CloseIcon />} onClick={() => navigate('/dashboard')} sx={{ px: 3 }}>Cancel</Button>
        <Button variant="contained" startIcon={<SaveOutlinedIcon />} sx={{ px: 3 }} onClick={handleCreateTicket}>Create Request</Button>
      </Box>
    </Box>
  );
}
