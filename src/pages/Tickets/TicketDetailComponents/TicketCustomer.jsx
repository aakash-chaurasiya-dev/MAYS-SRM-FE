import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Box, Typography, Paper, Divider, Avatar, Autocomplete, TextField } from '@mui/material';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import { useTheme } from '@mui/material/styles';
import api from '../../../services/api';

/**
 * TicketCustomer
 * 
 * Manages the display of customer information. 
 * Editing customer is currently disabled as it shouldn't change after creation.
 */
const TicketCustomer = forwardRef(({ ticket, isNormalUser, isEditMode, fullWidth = false }, ref) => {
  const theme = useTheme();
  
  // const [customerOptions, setCustomerOptions] = useState([]);
  // const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Initialize edit state when entering edit mode (Commented out as per request)
  /*
  useEffect(() => {
    if (isEditMode) {
      const fetchCustomers = async () => {
        try {
          const res = await api.get('/users');
          const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          setCustomerOptions(data);
          
          const current = data.find(u => u.userId === ticket?.userRefNo || String(u.userId) === String(ticket?.userRefNo));
          setSelectedCustomer(current || null);
        } catch (err) {
          console.error('Failed to fetch customers', err);
        }
      };
      fetchCustomers();
    }
  }, [isEditMode, ticket]);
  */

  useImperativeHandle(ref, () => ({
    getFormData: () => ({
      // Return nothing or original so it doesn't try to change it
      // userRefNo: selectedCustomer ? String(selectedCustomer.userId) : ticket?.userRefNo,
    })
  }));

  // Helper to provide a default string when value is falsy
  const valueOrNA = (value) => {
    if (value === undefined || value === null || value === '') return 'Not available';
    return String(value);
  };

  const customerName = [ticket?.userFirstName, ticket?.userLastName].filter(Boolean).join(' ');
  const customerInitials = customerName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'NA';
  const customerEmail = valueOrNA(ticket?.emailId);
  const customerPhone = valueOrNA(ticket?.userMobileNo);
  const branch = valueOrNA(ticket?.branchName);

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5,
  };

  return (
    <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5, width: fullWidth ? '100%' : { xs: '100%', md: 'calc(50% - 10px)' } }}>
      <Box sx={{ px: 2.5, py: 1.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonOutlinedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
          <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Customer Information</Typography>
        </Box>
      </Box>
      <Divider />
      <Box sx={{ p: 2.5 }}>
        {/*
        {isEditMode ? (
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
        */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: theme.palette.primary.main, fontSize: '0.85rem', fontWeight: 700 }}>
              {customerInitials}
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>{valueOrNA(customerName)}</Typography>
            </Box>
          </Box>
        {/* )} */}
        
        <Box sx={{ display: 'grid', gridTemplateColumns: fullWidth ? '1fr' : 'repeat(2, 1fr)', gap: 2 }}>
          {[
            ['Ticket ID', ticket?.ticketId ? `TK-${ticket.ticketId}` : 'Not available'],
            ['Email', customerEmail], 
            ['Phone', customerPhone], 
            ['Branch', branch],
            ['Customer Address', valueOrNA(ticket?.customerAddress)],
            ['Vendor Name', valueOrNA(ticket?.vendorName)],
            ['Vendor User Name', valueOrNA(ticket?.vendorUserName)],
            ['Vendor User Mobile No', valueOrNA(ticket?.vendorUserMobileNo)]
          ].map(([label, value]) => (
            <Box key={label} sx={{ mb: 1.2 }}>
              <Typography sx={lbl}>{label}</Typography>
              <Typography sx={{ fontSize: '13px', wordBreak: 'break-word' }}>{value}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
});

export default TicketCustomer;
