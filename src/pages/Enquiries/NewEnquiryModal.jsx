import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, TextField, Button, MenuItem, Divider,
  CircularProgress, IconButton, Autocomplete,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import { useTheme } from '@mui/material/styles';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export const PURPOSE_OPTIONS = [
  { value: 0, label: 'Enquiry' },
  { value: 1, label: 'Inward' },
  // { value: 2, label: 'Outward' },
];

const initialForm = {
  action: 0,
  brandId: '',
  modelId: '',
  customModelName: '',
  serialNo: '',
  enquiryFor: '',
  queryText: '',
};

export default function NewEnquiryModal({ open, onClose, onCreated }) {
  const theme = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => (await api.get('/brands')).data || [],
    enabled: open,
  });

  const { data: models = [] } = useQuery({
    queryKey: ['models'],
    queryFn: async () => (await api.get('/devicemodels')).data || [],
    enabled: open,
  });

  const selectedBrand = brands.find((b) => String(b.brandId) === String(form.brandId));
  const filteredModels = selectedBrand
    ? models.filter((m) => m.brandName === selectedBrand.brandName)
    : [];

  useEffect(() => {
    if (!open) setForm(initialForm);
  }, [open]);

  const createMutation = useMutation({
    mutationFn: async (payload) => (await api.post('/enquiries', payload)).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['enquiries-pending-count'] });
      window.dispatchEvent(
        new CustomEvent('app-notification', {
          detail: { message: 'Enquiry created successfully!', severity: 'success' },
        })
      );
      setForm(initialForm);
      onCreated?.(data);
      onClose?.();
    },
    onError: (err) => {
      window.dispatchEvent(
        new CustomEvent('app-notification', {
          detail: {
            message: err?.response?.data?.message || 'Failed to create enquiry',
            severity: 'error',
          },
        })
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.enquiryFor || !form.serialNo || !form.queryText) return;

    const payload = {
      userId: user?.userId,
      action: Number(form.action),
      enquiryFor: form.enquiryFor,
      queryText: form.queryText,
      serialNo: form.serialNo,
      brandId: form.brandId ? Number(form.brandId) : null,
      modelId: form.modelId ? Number(form.modelId) : null,
      customModelName: form.customModelName || null,
    };
    createMutation.mutate(payload);
  };

  const labelSx = {
    fontSize: '12px',
    fontWeight: 700,
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    mb: 0.8,
    mt: 2,
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: '4px' } }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 1.8,
          bgcolor: `${theme.palette.primary.main}06`,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 600 }}>Create New Enquiry</Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ px: 3, py: 2 }}>
          {/* Purpose */}
          <Typography sx={{ ...labelSx, mt: 0 }}>Purpose</Typography>
          <TextField
            select
            fullWidth
            size="small"
            required
            value={form.action}
            onChange={(e) => setForm((p) => ({ ...p, action: e.target.value }))}
          >
            {PURPOSE_OPTIONS.map((p) => (
              <MenuItem key={p.value} value={p.value}>
                {p.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Brand */}
          <Typography sx={labelSx}>Device Brand</Typography>
          <Autocomplete
            options={brands}
            getOptionLabel={(o) => o.brandName || ''}
            value={brands.find((b) => b.brandId === form.brandId) || null}
            onChange={(e, v) =>
              setForm((p) => ({
                ...p,
                brandId: v?.brandId || '',
                modelId: '',
                customModelName: '',
              }))
            }
            renderInput={(params) => (
              <TextField {...params} placeholder="Select brand…" size="small" />
            )}
          />

          {/* Model */}
          <Typography sx={labelSx}>Device Model</Typography>
          <Autocomplete
            freeSolo
            options={filteredModels}
            getOptionLabel={(o) => (typeof o === 'string' ? o : o.modelName || '')}
            value={
              models.find((m) => String(m.modelId) === String(form.modelId)) ||
              form.customModelName ||
              ''
            }
            disabled={!form.brandId}
            onChange={(e, v) => {
              if (typeof v === 'string') {
                setForm((p) => ({ ...p, modelId: '', customModelName: v }));
              } else if (v && v.modelId) {
                setForm((p) => ({ ...p, modelId: v.modelId, customModelName: '' }));
              } else {
                setForm((p) => ({ ...p, modelId: '', customModelName: '' }));
              }
            }}
            onInputChange={(e, val) => {
              const match = filteredModels.find(
                (m) => (m.modelName || '').toLowerCase() === val.toLowerCase()
              );
              if (match) {
                setForm((p) => ({ ...p, modelId: match.modelId, customModelName: '' }));
              } else {
                setForm((p) => ({ ...p, modelId: '', customModelName: val }));
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={form.brandId ? 'Select or type model…' : 'Select brand first…'}
                size="small"
              />
            )}
          />

          {/* Serial No */}
          <Typography sx={labelSx}>Device Serial Number</Typography>
          <TextField
            fullWidth
            size="small"
            required
            placeholder="e.g. S/N, Service Tag"
            value={form.serialNo}
            onChange={(e) => setForm((p) => ({ ...p, serialNo: e.target.value }))}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '13px',
              },
            }}
          />

          {/* Enquiry For */}
          <Typography sx={labelSx}>Enquiry Summary</Typography>
          <TextField
            fullWidth
            size="small"
            required
            placeholder="e.g. Broken screen fix estimate"
            value={form.enquiryFor}
            onChange={(e) => setForm((p) => ({ ...p, enquiryFor: e.target.value }))}
          />

          {/* Query Text */}
          <Typography sx={labelSx}>Query / Description</Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            required
            placeholder="Describe your query in detail…"
            value={form.queryText}
            onChange={(e) => setForm((p) => ({ ...p, queryText: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
          />

          
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={onClose} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={
              createMutation.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SendOutlinedIcon />
              )
            }
            disabled={createMutation.isPending}
          >
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}