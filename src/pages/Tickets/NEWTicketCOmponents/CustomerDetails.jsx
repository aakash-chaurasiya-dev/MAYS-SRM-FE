import { Box, Typography, Autocomplete, TextField, Paper, Divider, MenuItem } from '@mui/material';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { useTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

export default function CustomerDetails({ isNormalUser, isVendor = false, form, setForm, handleChange, customers, vendors = [], lbl, secHdr }) {
  const theme = useTheme();

  // Fetch vendor users when a vendorId is set from the selected customer
  const { data: vendorUsers = [] } = useQuery({
    queryKey: ['vendorUsers', form.vendorId],
    queryFn: async () => {
      const res = await api.get(`/vendor-users/vendor/${form.vendorId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!form.vendorId,
    staleTime: 1000 * 60 * 5,
  });

  // Filter customers by selected vendor
  const filteredCustomers = form.vendorId
    ? customers.filter(c => String(c.vendorId) === String(form.vendorId))
    : customers;

  // Derive the selected vendor user label
  const selectedVendorUser = vendorUsers.find(vu => String(vu.id) === String(form.vendorUserId));

  const infoField = (icon, value, placeholder) => (
    <TextField
      fullWidth
      size="small"
      value={value || ''}
      placeholder={placeholder}
      slotProps={{
        input: {
          readOnly: true,
          startAdornment: icon ? (
            <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}>{icon}</Box>
          ) : undefined,
        }
      }}
      sx={{ '& .MuiOutlinedInput-root': { bgcolor: theme.palette.action.hover, fontSize: '13px' } }}
    />
  );

  return (
    <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
      <Box sx={secHdr}>
        <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Customer Details</Typography>
      </Box>
      <Divider />
      <Box sx={{ p: 2.5 }}>

        {/* ── Vendor Selector (staff only) ── */}
        {!isNormalUser && !isVendor && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={lbl}>Vendor</Typography>
            <Autocomplete
              options={vendors}
              getOptionLabel={(option) => option.name || ''}
              value={vendors.find(v => String(v.id) === String(form.vendorId)) || null}
              onChange={(e, newValue) => {
                setForm(prev => ({
                  ...prev,
                  vendorId: newValue ? newValue.id : '',
                  vendorUserId: '', // Reset vendor user when vendor changes
                  customerId: '', // Reset customer when vendor changes
                  customCustomerName: '',
                  phone: '',
                  email: '',
                  customerAddress: '',
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select a vendor…"
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                />
              )}
            />
          </Box>
        )}

        {/* ── Vendor User Selector ── */}
        {!isNormalUser && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={lbl}>Vendor User</Typography>
            <Autocomplete
              options={vendorUsers}
              getOptionLabel={(option) => `${option.user}${option.contactNo ? ` — ${option.contactNo}` : ''}`}
              value={vendorUsers.find(vu => String(vu.id) === String(form.vendorUserId)) || null}
              onChange={(e, newValue) => {
                setForm(prev => ({
                  ...prev,
                  vendorUserId: newValue ? newValue.id : '',
                }));
              }}
              disabled={!form.vendorId}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={form.vendorId ? "Select a vendor user…" : "Select a vendor first…"}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                />
              )}
            />
          </Box>
        )}

        {/* ── Vendor User Mobile No (read-only) ── */}
        {!isNormalUser && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={lbl}>Vendor User Mobile No</Typography>
            {infoField(<PhoneOutlinedIcon fontSize="small" />, selectedVendorUser?.contactNo || '', 'No contact number')}
          </Box>
        )}

        {/* ── Customer Selector ── */}
        {isNormalUser ? (
          <Box sx={{ mb: 2 }}>
            <Typography sx={lbl}>Customer</Typography>
            <TextField fullWidth size="small" value={form.customCustomerName || ''} disabled
              slotProps={{ input: { startAdornment: <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}><PersonOutlinedIcon fontSize="small" /></Box> } }} />
          </Box>
        ) : (
          <Box sx={{ mb: 2 }}>
            <Typography sx={lbl}>Customer Name or Phone</Typography>
            <Autocomplete
              freeSolo
              options={filteredCustomers}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return `${option.firstName} ${option.lastName} - ${option.mobileNo}`;
              }}
              value={
                filteredCustomers.find(c => String(c.userId) === String(form.customerId)) ||
                form.customCustomerName ||
                ''
              }
              onChange={(e, newValue) => {
                if (typeof newValue === 'string') {
                  setForm(prev => ({
                    ...prev,
                    customerId: '',
                    customCustomerName: newValue,
                    phone: '',
                    email: '',
                    customerAddress: '',
                  }));
                } else if (newValue && newValue.userId) {
                  setForm(prev => ({
                    ...prev,
                    customerId: newValue.userId,
                    customCustomerName: '',
                    phone: newValue.mobileNo || '',
                    email: newValue.emailId || '',
                    customerAddress: newValue.address || '',
                    vendorId: newValue.vendorId || prev.vendorId || '',
                    vendorUserId: newValue.vendorId === prev.vendorId ? prev.vendorUserId : '',
                  }));
                } else {
                  setForm(prev => ({
                    ...prev,
                    customerId: '',
                    customCustomerName: '',
                    phone: '',
                    email: '',
                    customerAddress: '',
                  }));
                }
              }}
              onInputChange={(e, newInputValue) => {
                const matchingCustomer = filteredCustomers.find(c =>
                  `${c.firstName} ${c.lastName} - ${c.mobileNo}` === newInputValue ||
                  `${c.firstName} ${c.lastName}` === newInputValue
                );
                if (matchingCustomer) {
                  setForm((prev) => ({
                    ...prev,
                    customerId: matchingCustomer.userId,
                    customCustomerName: '',
                    phone: matchingCustomer.mobileNo || '',
                    email: matchingCustomer.emailId || '',
                    customerAddress: matchingCustomer.address || '',
                    vendorId: matchingCustomer.vendorId || prev.vendorId || '',
                    vendorUserId: matchingCustomer.vendorId === prev.vendorId ? prev.vendorUserId : '',
                  }));
                } else {
                  setForm((prev) => ({
                    ...prev,
                    customerId: '',
                    customCustomerName: newInputValue,
                  }));
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select or type a customer…"
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                />
              )}
            />
          </Box>
        )}

        {/* ── Phone & Email ── */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={lbl}>Phone</Typography>
            <TextField fullWidth size="small" placeholder="+1 (555) 000-0000" value={form.phone}
              onChange={handleChange('phone')}
              slotProps={{ input: { readOnly: !!form.customerId, startAdornment: <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}><PhoneOutlinedIcon fontSize="small" /></Box> } }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={lbl}>Email</Typography>
            <TextField fullWidth size="small" placeholder="customer@email.com" value={form.email}
              onChange={handleChange('email')}
              slotProps={{ input: { readOnly: !!form.customerId, startAdornment: <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}><EmailOutlinedIcon fontSize="small" /></Box> } }} />
          </Box>
        </Box>

        {/* ── Customer Address (editable) ── */}
        <Box sx={{ mb: 0 }}>
          <Typography sx={lbl}>Customer Address</Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Enter or auto-fill customer address"
            value={form.customerAddress || ''}
            onChange={handleChange('customerAddress')}
            slotProps={{ input: { startAdornment: <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}><LocationOnOutlinedIcon fontSize="small" /></Box> } }}
          />
        </Box>

      </Box>
    </Paper>
  );
}
