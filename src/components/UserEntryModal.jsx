import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Radio, RadioGroup, FormControlLabel, FormControl, TextField, Typography, CircularProgress, Box, Divider, MenuItem, Autocomplete } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function UserEntryModal({ open, onClose }) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  // Form states
  const [customerForm, setCustomerForm] = useState({
    customerName: '',
    mobileNo: '',
    emailId: '',
    address: ''
  });

  const [deviceForm, setDeviceForm] = useState({
    serialNo: '',
    deviceTypeId: '',
    brandId: '',
    modelId: '',
    customModelName: ''
  });

  const [enquiryForm, setEnquiryForm] = useState({
    enquiryFor: '',
    queryText: ''
  });

  const [inwardForm, setInwardForm] = useState({
    inwardRemarks: ''
  });

  const [outwardForm, setOutwardForm] = useState({
    ticketId: null,
    outwardRemarks: '',
    handoverToName: '',
    handoverToPhone: ''
  });

  // Reset forms when modal closes
  useEffect(() => {
    if (!open) {
      setReason('');
      setCustomReason('');
      setCustomerForm({ customerName: '', mobileNo: '', emailId: '', address: '' });
      setDeviceForm({ serialNo: '', deviceTypeId: '', brandId: '', modelId: '', customModelName: '' });
      setEnquiryForm({ enquiryFor: '', queryText: '' });
      setInwardForm({ inwardRemarks: '' });
      setOutwardForm({ ticketId: null, outwardRemarks: '', handoverToName: '', handoverToPhone: '' });
    }
  }, [open]);

  // Queries for dropdowns
  const { data: deviceTypes = [] } = useQuery({ queryKey: ['deviceTypes'], queryFn: async () => (await api.get('/devicetypes')).data });
  const { data: brands = [] } = useQuery({ queryKey: ['brands'], queryFn: async () => (await api.get('/brands')).data });
  const { data: models = [] } = useQuery({ queryKey: ['deviceModels', deviceForm.brandId], queryFn: async () => deviceForm.brandId ? (await api.get(`/device-models/brand/${deviceForm.brandId}`)).data : [], enabled: !!deviceForm.brandId });
  
  // Eligible tickets for outward
  const { data: eligibleTickets = [] } = useQuery({ 
    queryKey: ['eligibleTickets', user?.userId], 
    queryFn: async () => (await api.get(`/tickets/user/${user?.userId}/eligible-outward`)).data,
    enabled: reason === 'Outward' && !!user?.userId
  });

  const handleSuccess = (msg) => {
    window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: msg, severity: 'success' } }));
    sessionStorage.setItem('hasAnsweredHereFor', 'true');
    onClose();
  };

  // Basic entry mutation (for Ticket Status Check, Others)
  const submitBasicEntryMutation = useMutation({
    mutationFn: async (payload) => api.post('/user-entry-reports', payload),
    onSuccess: () => handleSuccess('Entry recorded successfully.')
  });

  // Specific Entry Mutations
  const submitEnquiryMutation = useMutation({
    mutationFn: async (payload) => api.post('/enquiries', payload),
    onSuccess: () => handleSuccess('Enquiry created successfully.')
  });

  const submitInwardMutation = useMutation({
    mutationFn: async (payload) => api.post('/inward', payload),
    onSuccess: () => handleSuccess('Inward record created successfully.')
  });

  const submitOutwardMutation = useMutation({
    mutationFn: async (payload) => api.post('/outward', payload),
    onSuccess: () => handleSuccess('Outward record created successfully.')
  });

  const handleSubmit = () => {
    if (reason === 'Enquiry') {
      submitEnquiryMutation.mutate({
        userId: user?.userId,
        ...customerForm,
        ...deviceForm,
        ...enquiryForm
      });
    } else if (reason === 'Inward') {
      submitInwardMutation.mutate({
        userId: user?.userId,
        ...customerForm,
        ...deviceForm,
        ...inwardForm
      });
    } else if (reason === 'Outward') {
      submitOutwardMutation.mutate({
        userId: user?.userId,
        ticketId: outwardForm.ticketId?.ticketId,
        serialNo: outwardForm.ticketId?.device?.serialNo || 'N/A',
        handoverToName: outwardForm.handoverToName || customerForm.customerName,
        handoverToPhone: outwardForm.handoverToPhone || customerForm.mobileNo,
        outwardRemarks: outwardForm.outwardRemarks
      });
    } else {
      const finalReason = reason === 'Others' ? customReason : reason;
      if (!finalReason.trim()) return;
      submitBasicEntryMutation.mutate({ userId: user?.userId, reason: finalReason });
    }
  };

  const isPending = submitBasicEntryMutation.isPending || submitEnquiryMutation.isPending || submitInwardMutation.isPending || submitOutwardMutation.isPending;

  const renderCustomerForm = () => (
    <Box sx={{ mt: 1 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>Customer Details</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
        <TextField size="small" label="Name *" value={customerForm.customerName} onChange={e => setCustomerForm(prev => ({...prev, customerName: e.target.value}))} />
        <TextField size="small" label="Mobile No *" value={customerForm.mobileNo} onChange={e => setCustomerForm(prev => ({...prev, mobileNo: e.target.value}))} />
        <TextField size="small" label="Email" value={customerForm.emailId} onChange={e => setCustomerForm(prev => ({...prev, emailId: e.target.value}))} />
      </Box>
      <TextField fullWidth size="small" label="Address" value={customerForm.address} onChange={e => setCustomerForm(prev => ({...prev, address: e.target.value}))} />
    </Box>
  );

  const renderDeviceForm = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>Device Details</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
        <TextField size="small" label="Serial No *" value={deviceForm.serialNo} onChange={e => setDeviceForm(prev => ({...prev, serialNo: e.target.value}))} />
        <TextField size="small" select label="Device Type" value={deviceForm.deviceTypeId} onChange={e => setDeviceForm(prev => ({...prev, deviceTypeId: e.target.value}))}>
          <MenuItem value=""><em>None</em></MenuItem>
          {deviceTypes.map(dt => <MenuItem key={dt.deviceTypeId} value={dt.deviceTypeId}>{dt.name}</MenuItem>)}
        </TextField>
        <TextField size="small" select label="Brand" value={deviceForm.brandId} onChange={e => setDeviceForm(prev => ({...prev, brandId: e.target.value, modelId: ''}))}>
          <MenuItem value=""><em>None</em></MenuItem>
          {brands.map(b => <MenuItem key={b.brandId} value={b.brandId}>{b.name}</MenuItem>)}
        </TextField>
        <TextField size="small" select label="Model" value={deviceForm.modelId} onChange={e => setDeviceForm(prev => ({...prev, modelId: e.target.value}))} disabled={!deviceForm.brandId}>
          <MenuItem value=""><em>None</em></MenuItem>
          {models.map(m => <MenuItem key={m.modelId} value={m.modelId}>{m.name}</MenuItem>)}
        </TextField>
      </Box>
      <TextField fullWidth size="small" label="Custom Model / Notes" value={deviceForm.customModelName} onChange={e => setDeviceForm(prev => ({...prev, customModelName: e.target.value}))} />
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth={reason === 'Enquiry' || reason === 'Inward' ? 'md' : 'sm'} fullWidth disableEscapeKeyDown={isPending}>
      <DialogTitle sx={{ fontWeight: 600, borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        New Entry
      </DialogTitle>
      <DialogContent>
        <TextField
          select
          fullWidth
          size="small"
          label="Purpose"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          sx={{ mb: 2 }}
        >
          <MenuItem value="" disabled><em>Select purpose...</em></MenuItem>
          <MenuItem value="Enquiry">Enquiry</MenuItem>
          <MenuItem value="Inward">Inward</MenuItem>
          <MenuItem value="Outward">Outward</MenuItem>
        </TextField>

        <Divider sx={{ mb: 2 }} />

        {/* Dynamic Forms */}
        {reason === 'Others' && (
          <TextField fullWidth size="small" placeholder="Please specify your reason..." value={customReason} onChange={(e) => setCustomReason(e.target.value)} autoFocus />
        )}

        {(reason === 'Enquiry' || reason === 'Inward') && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {renderDeviceForm()}
            <Divider sx={{ my: 1 }} />
            {reason === 'Enquiry' && (
              <Box>
                 <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>Enquiry Details</Typography>
                 <TextField fullWidth size="small" label="Subject / Enquiry For" sx={{ mb: 2 }} value={enquiryForm.enquiryFor} onChange={e => setEnquiryForm(prev => ({...prev, enquiryFor: e.target.value}))} />
                 <TextField fullWidth size="small" label="Query / Description" multiline rows={3} value={enquiryForm.queryText} onChange={e => setEnquiryForm(prev => ({...prev, queryText: e.target.value}))} />
              </Box>
            )}
            {reason === 'Inward' && (
              <Box>
                 <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>Inward Remarks</Typography>
                 <TextField fullWidth size="small" label="Receipt / Condition Notes" multiline rows={3} value={inwardForm.inwardRemarks} onChange={e => setInwardForm(prev => ({...prev, inwardRemarks: e.target.value}))} />
              </Box>
            )}
          </Box>
        )}

        {reason === 'Outward' && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>Ticket Selection</Typography>
            <Autocomplete
              options={eligibleTickets}
              getOptionLabel={(option) => `Ticket #${option.ticketId} - ${option.device?.serialNo || 'N/A'}`}
              value={outwardForm.ticketId}
              onChange={(e, val) => setOutwardForm(prev => ({...prev, ticketId: val}))}
              renderInput={(params) => <TextField {...params} size="small" label="Select Eligible Ticket" />}
              sx={{ mb: 2 }}
            />
            
            {outwardForm.ticketId && (
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Ticket Summary:</Typography>
                <Typography variant="body2">Status: {outwardForm.ticketId.ticketStatus}</Typography>
                <Typography variant="body2">Device: {outwardForm.ticketId.device?.serialNo}</Typography>
                <Typography variant="body2">Customer Ref: {outwardForm.ticketId.userRefNo?.firstName} {outwardForm.ticketId.userRefNo?.lastName}</Typography>
              </Box>
            )}

          </Box>
        )}

      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} disabled={isPending}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isPending || (reason === 'Outward' && !outwardForm.ticketId) || !reason}>
          {isPending ? <CircularProgress size={24} color="inherit" /> : 'Submit Entry'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
