import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Box, Typography, Paper, Divider, TextField, MenuItem, Autocomplete, Stack } from '@mui/material';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import { useTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

/**
 * TicketDevice
 * 
 * Manages the display and editing of device details associated with a ticket.
 * It handles the complex logic of cascading dropdowns (Device Types -> Brands -> Models)
 * as well as custom models, serial numbers, and warranty types.
 */
const TicketDevice = forwardRef(({ ticket, isEditMode, isNormalUser }, ref) => {
  const theme = useTheme();

  // 1. Fetch Lookups globally cached via React Query
  const { data: deviceTypes = [] } = useQuery({
    queryKey: ['deviceTypes'],
    queryFn: async () => {
      const res = await api.get('/devicetypes');
      return res.data;
    },
    enabled: !isNormalUser,
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await api.get('/brands');
      return res.data;
    },
    enabled: !isNormalUser,
  });

  const { data: models = [] } = useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const res = await api.get('/devicemodels');
      return res.data;
    },
    enabled: !isNormalUser,
  });

  const { data: referredCategories = [] } = useQuery({
    queryKey: ['referredCategories'],
    queryFn: async () => {
      const res = await api.get('/referred-categories');
      return res.data?.data || res.data || [];
    },
    enabled: !isNormalUser,
  });

  const { data: warrantyTypes = [] } = useQuery({
    queryKey: ['warrantyTypes'],
    queryFn: async () => {
      const res = await api.get('/warranty-types');
      return res.data?.data || res.data || [];
    },
    enabled: !isNormalUser,
  });

  const [filteredBrands, setFilteredBrands] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);

  // Form State
  const [editForm, setEditForm] = useState({
    deviceTypeId: '',
    brandId: '',
    modelId: '',
    serialNo: '',
    referredCategoryId: '',
    referredCategoryDecriptionTicket: '',
    warrantyTypeId: '',
    customModelName: '',
  });

  // When edit mode triggers (or data loads), initialize the form
  useEffect(() => {
    if (isEditMode) {
      const deviceTypeId = ticket?.deviceTypeId || '';
      const brandId = ticket?.deviceBrandId || '';
      const modelId = ticket?.deviceModelId || '';
      const currentSerialNo = ticket?.deviceSerialNo || '';
      const referredCategoryId = ticket?.referredCategoryId || '';
      const referredCategoryDecriptionTicket = ticket?.referredCategoryDecriptionTicket || '';
      const warrantyTypeId = ticket?.warrantyTypeId || '';

      setEditForm({
        deviceTypeId,
        brandId,
        modelId,
        serialNo: currentSerialNo,
        referredCategoryId,
        referredCategoryDecriptionTicket,
        warrantyTypeId,
        customModelName: '',
      });

      // Populate cascades
      if (deviceTypeId) {
        const dType = deviceTypes.find(dt => dt.deviceTypeId === deviceTypeId);
        window.dispatchEvent(new CustomEvent('ticketDeviceTypeChanged', { detail: dType?.deviceTypeName || ticket?.deviceTypeName || '' }));
        const filtered = brands.filter(b => b.deviceTypeName === (dType?.deviceTypeName || ticket?.deviceTypeName));
        setFilteredBrands(filtered.length > 0 ? filtered : brands);
      } else {
        window.dispatchEvent(new CustomEvent('ticketDeviceTypeChanged', { detail: '' }));
        setFilteredBrands([]);
      }

      if (brandId) {
        const sBrand = brands.find(b => b.brandId === brandId);
        const filtered = models.filter(m => m.brandName === (sBrand?.brandName || ticket?.deviceBrandName));
        setFilteredModels(filtered.length > 0 ? filtered : models);
      } else {
        setFilteredModels([]);
      }
    }
  }, [isEditMode, ticket, deviceTypes, brands, models]);

  useImperativeHandle(ref, () => ({
    getFormData: () => ({
      deviceSerialNo: editForm.serialNo,
      deviceModelId: editForm.modelId || null,
      customModelName: editForm.customModelName || null,
      brandId: editForm.brandId || null,
      referredCategoryId: editForm.referredCategoryId || null,
      referredCategoryDecriptionTicket: editForm.referredCategoryDecriptionTicket || '',
      warrantyTypeId: editForm.warrantyTypeId || null,
    })
  }));

  const valueOrNA = (value) => {
    if (value === undefined || value === null || value === '') return 'Not available';
    return String(value);
  };

  const deviceType = valueOrNA(ticket?.deviceTypeName);
  const brand = valueOrNA(ticket?.deviceBrandName);
  const model = valueOrNA(ticket?.deviceModelName);
  const ticketType = valueOrNA(ticket?.ticketTypeName);
  const serialNo = valueOrNA(ticket?.deviceSerialNo);
  const warranty = valueOrNA(ticket?.warrantyTypeName);
  const referredCategory = valueOrNA(ticket?.referredCategoryName);
  const referredCategoryDescription = valueOrNA(ticket?.referredCategoryDecriptionTicket);

  const handleDeviceTypeChange = (e) => {
    const deviceTypeId = e.target.value;
    setEditForm(prev => ({ ...prev, deviceTypeId, brandId: '', modelId: '' }));
    
    const selectedDeviceType = deviceTypes.find(dt => dt.deviceTypeId === deviceTypeId);
    window.dispatchEvent(new CustomEvent('ticketDeviceTypeChanged', { detail: selectedDeviceType?.deviceTypeName || '' }));
    
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
    setEditForm(prev => ({ ...prev, brandId, modelId: '' }));

    const selectedBrand = brands.find(b => b.brandId === brandId);
    if (selectedBrand) {
      const filtered = models.filter(m => m.brandName === selectedBrand.brandName);
      setFilteredModels(filtered.length > 0 ? filtered : models);
    } else {
      setFilteredModels(models);
    }
  };

  const handleFieldChange = (field) => (e) => {
    setEditForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5,
  };

  return (
    <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5, width: { xs: '100%', md: 'calc(50% - 10px)' } }}>
      <Box sx={{ px: 2.5, py: 1.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LaptopMacIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
          <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Device Details</Typography>
        </Box>
      </Box>
      <Divider />
      <Box sx={{ p: 2.5 }}>
        {isEditMode ? (
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={lbl}>Device Type</Typography>
                <TextField select fullWidth size="small" value={editForm.deviceTypeId} onChange={handleDeviceTypeChange} displayEmpty sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}>
                  <MenuItem value="" disabled>Select type…</MenuItem>
                  {deviceTypes.map((t) => <MenuItem key={t.deviceTypeId} value={t.deviceTypeId}>{t.deviceTypeName}</MenuItem>)}
                </TextField>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={lbl}>Brand</Typography>
                <TextField select fullWidth size="small" value={editForm.brandId} onChange={handleBrandChange} disabled={!editForm.deviceTypeId || filteredBrands.length === 0} displayEmpty sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}>
                  <MenuItem value="" disabled>Select brand…</MenuItem>
                  {filteredBrands.map((b) => <MenuItem key={b.brandId} value={b.brandId}>{b.brandName}</MenuItem>)}
                </TextField>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={lbl}>Model</Typography>
                <Autocomplete
                  freeSolo
                  disabled={!editForm.brandId}
                  options={filteredModels}
                  getOptionLabel={(option) => typeof option === 'string' ? option : (option.modelName || '')}
                  value={filteredModels.find(m => String(m.modelId) === String(editForm.modelId)) || editForm.customModelName || ''}
                  onChange={(e, newValue) => {
                    if (typeof newValue === 'string') {
                      setEditForm(prev => ({ ...prev, modelId: '', customModelName: newValue }));
                    } else if (newValue && newValue.modelId) {
                      setEditForm(prev => ({ ...prev, modelId: newValue.modelId, customModelName: '' }));
                    } else {
                      setEditForm(prev => ({ ...prev, modelId: '', customModelName: '' }));
                    }
                  }}
                  onInputChange={(e, newInputValue) => {
                    const matching = filteredModels.find(m => m.modelName.toLowerCase() === newInputValue.toLowerCase());
                    if (matching) {
                      setEditForm(prev => ({ ...prev, modelId: matching.modelId, customModelName: '' }));
                    } else {
                      setEditForm(prev => ({ ...prev, modelId: '', customModelName: newInputValue }));
                    }
                  }}
                  renderInput={(params) => <TextField {...params} placeholder="Select or type model…" size="small" sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }} />}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={lbl}>Serial Number</Typography>
                <TextField fullWidth size="small" placeholder="S/N" value={editForm.serialNo} onChange={handleFieldChange('serialNo')} sx={{ '& .MuiOutlinedInput-root': { fontFamily: '"JetBrains Mono", monospace', fontSize: '13px' } }} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={lbl}>Warranty Type</Typography>
                <Autocomplete
                  options={warrantyTypes}
                  getOptionLabel={(option) => option.warrantyTypeName || ''}
                  value={warrantyTypes.find((w) => w.warrantyTypeId === editForm.warrantyTypeId) || null}
                  onChange={(e, newValue) => setEditForm(prev => ({ ...prev, warrantyTypeId: newValue ? newValue.warrantyTypeId : '' }))}
                  renderInput={(params) => <TextField {...params} placeholder="Select warranty type…" size="small" sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }} />}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={lbl}>Referred Category</Typography>
                <Autocomplete
                  options={referredCategories}
                  getOptionLabel={(option) => option.referredCategoryName || ''}
                  value={referredCategories.find((r) => r.referredCategoryId === editForm.referredCategoryId) || null}
                  onChange={(e, newValue) => setEditForm(prev => ({ ...prev, referredCategoryId: newValue ? newValue.referredCategoryId : '' }))}
                  renderInput={(params) => <TextField {...params} placeholder="Select category…" size="small" sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }} />}
                />
              </Box>
            </Box>
            <Box>
              <Typography sx={lbl}>Referred Description / Note</Typography>
              <TextField
                fullWidth size="small" placeholder="Referred description details…"
                value={editForm.referredCategoryDecriptionTicket || ''}
                onChange={handleFieldChange('referredCategoryDecriptionTicket')}
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
              />
            </Box>
          </Stack>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {[
              { label: 'Device Type', value: deviceType, mono: false },
              { label: 'Brand', value: brand, mono: false },
              { label: 'Model', value: model, mono: false },
              { label: 'Serial No.', value: serialNo, mono: true },
              { label: 'Warranty', value: warranty, mono: false },
              { label: 'Referred Category', value: referredCategory, mono: false },
              { label: 'Referred Desc / Note', value: referredCategoryDescription, mono: false },
              { label: 'Type', value: ticketType, mono: false }
            ].map(({ label, value, mono }) => (
              <Box key={label} sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography sx={lbl}>{label}</Typography>
                <Typography sx={{ 
                  fontSize: '13px', 
                  fontFamily: mono ? '"JetBrains Mono", monospace' : 'inherit',
                  color: value === 'Not available' ? theme.palette.text.disabled : theme.palette.text.primary,
                  fontWeight: value !== 'Not available' ? 500 : 400
                }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Paper>
  );
});

export default TicketDevice;
