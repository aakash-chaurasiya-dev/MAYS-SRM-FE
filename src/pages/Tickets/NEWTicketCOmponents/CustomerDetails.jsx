import { Box, Typography, Autocomplete, TextField, Paper, Divider, MenuItem } from '@mui/material';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { useTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

export default function CustomerDetails({ isNormalUser, form, setForm, handleChange, customers, lbl, secHdr }) {
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

        {/* ── Customer Selector ── */}
        {isNormalUser ? (
          <Box sx={{ mb: 2 }}>
            <Typography sx={lbl}>Customer</Typography>
            <TextField fullWidth size="small" value={form.customCustomerName} disabled
              slotProps={{ input: { startAdornment: <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}><PersonOutlinedIcon fontSize="small" /></Box> } }} />
          </Box>
        ) : (
          <Typography sx={lbl}>Customer Name or Phone</Typography>
        )}

        {!isNormalUser && (
          <Autocomplete
            freeSolo
            options={customers}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option;
              return `${option.firstName} ${option.lastName} - ${option.mobileNo}`;
            }}
            value={
              customers.find(c => String(c.userId) === String(form.customerId)) ||
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
                  vendorId: '',
                  vendorUserId: '',
                }));
              } else if (newValue && newValue.userId) {
                setForm(prev => ({
                  ...prev,
                  customerId: newValue.userId,
                  customCustomerName: '',
                  phone: newValue.mobileNo || '',
                  email: newValue.emailId || '',
                  customerAddress: newValue.address || '',
                  vendorId: newValue.vendorId || '',
                  vendorUserId: '',
                }));
              } else {
                setForm(prev => ({
                  ...prev,
                  customerId: '',
                  customCustomerName: '',
                  phone: '',
                  email: '',
                  customerAddress: '',
                  vendorId: '',
                  vendorUserId: '',
                }));
              }
            }}
            onInputChange={(e, newInputValue) => {
              const matchingCustomer = customers.find(c =>
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
                  vendorId: matchingCustomer.vendorId || '',
                  vendorUserId: '',
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
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
              />
            )}
          />
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
        <Box sx={{ mb: 2 }}>
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

        {/* ── Vendor Name (read-only, auto-filled) — only for external vendors ── */}
        {form.vendorId > 1 && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={lbl}>Vendor Name</Typography>
            {infoField(
              <StorefrontOutlinedIcon fontSize="small" />,
              customers.find(c => String(c.userId) === String(form.customerId))?.vendorName ||
              (form.vendorId ? `Vendor ID: ${form.vendorId}` : ''),
              'Auto-filled from customer'
            )}
          </Box>
        )}

        {/* ── Vendor User Selection (dropdown with react-query) ── */}
        {form.vendorId > 1 && !isNormalUser && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={lbl}>Vendor User</Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={form.vendorUserId || ''}
              onChange={(e) => setForm(prev => ({ ...prev, vendorUserId: e.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
            >
              <MenuItem value=""><em>Not assigned</em></MenuItem>
              {vendorUsers.map(vu => (
                <MenuItem key={vu.id} value={vu.id}>
                  {vu.user}{vu.contactNo ? ` — ${vu.contactNo}` : ''}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        )}

        {/* ── Vendor User Mobile No (read-only, auto-filled from selection) ── */}
        {form.vendorUserId && selectedVendorUser?.contactNo && (
          <Box sx={{ mb: 0 }}>
            <Typography sx={lbl}>Vendor User Mobile No</Typography>
            {infoField(<PhoneOutlinedIcon fontSize="small" />, selectedVendorUser.contactNo, '')}
          </Box>
        )}

      </Box>
    </Paper>
  );
}
