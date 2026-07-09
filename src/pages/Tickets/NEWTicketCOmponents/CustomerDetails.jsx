import { Box, Typography, Autocomplete, TextField, Paper, Divider } from '@mui/material';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { useTheme } from '@mui/material/styles';

export default function CustomerDetails({ isNormalUser, form, setForm, handleChange, customers, lbl, secHdr }) {
  const theme = useTheme();

  return (
    <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
      <Box sx={secHdr}>
        <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Customer Details</Typography>
      </Box>
      <Divider />
      <Box sx={{ p: 2.5 }}>
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
                  email: ''
                }));
              } else if (newValue && newValue.userId) {
                setForm(prev => ({
                  ...prev,
                  customerId: newValue.userId,
                  customCustomerName: '',
                  phone: newValue.phone || '',
                  email: newValue.email || ''
                }));
              } else {
                setForm(prev => ({
                  ...prev,
                  customerId: '',
                  customCustomerName: '',
                  phone: '',
                  email: ''
                }));
              }
            }}
            onInputChange={(e, newInputValue) => {
              const matchingCustomer = customers.find(c =>
                `${c.firstName} ${c.lastName} - ${c.phone}` === newInputValue ||
                `${c.firstName} ${c.lastName}` === newInputValue
              );
              if (matchingCustomer) {
                setForm((prev) => ({
                  ...prev,
                  customerId: matchingCustomer.userId,
                  customCustomerName: '',
                  phone: matchingCustomer.phone || '',
                  email: matchingCustomer.email || ''
                }));
              } else {
                setForm((prev) => ({
                  ...prev,
                  customerId: '',
                  customCustomerName: newInputValue
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
        <Box sx={{ display: 'flex', gap: 2, mb: isNormalUser ? 0 : 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={lbl}>Phone</Typography>
            <TextField fullWidth size="small" placeholder="+1 (555) 000-0000" value={form.phone} onChange={handleChange('phone')} slotProps={{ input: { readOnly: !!form.customerId, startAdornment: <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}><PhoneOutlinedIcon fontSize="small" /></Box> } }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={lbl}>Email</Typography>
            <TextField fullWidth size="small" placeholder="customer@email.com" value={form.email} onChange={handleChange('email')} slotProps={{ input: { readOnly: !!form.customerId, startAdornment: <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}><EmailOutlinedIcon fontSize="small" /></Box> } }} />
          </Box>
        </Box>
        {!isNormalUser && (
          <>
            <Typography sx={lbl}>Customer Type</Typography>
            <Autocomplete
              options={['Walk-in', 'Professional Client', 'Corporate Account', 'Government']}
              value={form.customerType}
              onChange={(e, newValue) => handleChange('customerType')({ target: { value: newValue || '' } })}
              renderInput={(params) => (
                <TextField {...params} size="small" sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }} />
              )}
            />
          </>
        )}
      </Box>
    </Paper>
  );
}
