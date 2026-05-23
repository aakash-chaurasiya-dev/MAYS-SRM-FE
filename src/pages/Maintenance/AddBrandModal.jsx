import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, Box, MenuItem, Switch,
  FormControlLabel, Alert, Divider, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTheme } from '@mui/material/styles';

const CATEGORIES = [
  'Consumer Electronics',
  'Enterprise',
  'Gaming',
  'Mobile Devices',
  'Peripherals',
  'Networking',
];

export default function AddBrandModal({ open, onClose }) {
  const theme = useTheme();
  const [form, setForm] = useState({
    brandName: '',
    manufacturerCode: '',
    category: '',
    isActive: true,
  });

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = () => {
    // Placeholder — would submit to API
    onClose();
    setForm({ brandName: '', manufacturerCode: '', category: '', isActive: true });
  };

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.8,
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '4px',
          border: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, px: 3 }}>
        <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>Add New Brand</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: theme.palette.text.secondary }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, mb: 2.5 }}>
          Register a new manufacturing partner to the system.
        </Typography>

        <Typography sx={lbl}>Brand Name</Typography>
        <TextField
          fullWidth size="small" placeholder="e.g. Samsung"
          value={form.brandName} onChange={handleChange('brandName')}
          sx={{ mb: 2 }}
        />

        <Typography sx={lbl}>Manufacturer Code</Typography>
        <TextField
          fullWidth size="small" placeholder="e.g. SAM"
          value={form.manufacturerCode} onChange={handleChange('manufacturerCode')}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '13px',
              textTransform: 'uppercase',
            },
          }}
        />

        <Typography sx={lbl}>Category</Typography>
        <TextField
          fullWidth size="small" select
          value={form.category} onChange={handleChange('category')}
          sx={{ mb: 2 }}
        >
          <MenuItem value="" disabled>Select category…</MenuItem>
          {CATEGORIES.map((c) => (
            <MenuItem key={c} value={c}>{c}</MenuItem>
          ))}
        </TextField>

        <FormControlLabel
          control={
            <Switch
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              color="primary"
            />
          }
          label={
            <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>
              Active Status
            </Typography>
          }
          sx={{ mb: 2 }}
        />

        <Alert
          severity="info"
          icon={<InfoOutlinedIcon sx={{ fontSize: 18 }} />}
          sx={{
            fontSize: '12px',
            borderRadius: '3px',
            '& .MuiAlert-message': { fontSize: '12px' },
          }}
        >
          New brands will be immediately available for ticket assignment across all terminals once saved.
        </Alert>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={onClose} sx={{ px: 3 }}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} sx={{ px: 3 }}>Save Brand</Button>
      </DialogActions>
    </Dialog>
  );
}
