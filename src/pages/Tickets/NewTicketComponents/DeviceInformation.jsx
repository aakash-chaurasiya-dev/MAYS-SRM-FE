import { Box, Typography, Autocomplete, TextField, Paper, Divider } from '@mui/material';

export default function DeviceInformation({ form, setForm, handleChange, handleDeviceTypeChange, deviceTypes, brands, models, lbl, secHdr }) {
  return (
    <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden' }}>
      <Box sx={secHdr}><Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Device Information</Typography></Box>
      <Divider />
      <Box sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1 }}><Typography sx={lbl}>Device Type</Typography>
            <Autocomplete
              options={deviceTypes}
              getOptionLabel={(option) => option.deviceTypeName}
              value={deviceTypes.find((t) => t.deviceTypeId === form.deviceTypeId) || null}
              onChange={(e, newValue) => {
                handleDeviceTypeChange({ target: { value: newValue ? newValue.deviceTypeId : '' } });
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select type…" size="small" sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }} />
              )}
            />
          </Box>
          <Box sx={{ flex: 1 }}><Typography sx={lbl}>Brand</Typography>
            <Autocomplete
              options={brands}
              getOptionLabel={(option) => option.brandName}
              value={brands.find((b) => b.brandId === form.brandId) || null}
              onChange={(e, newValue) => {
                setForm(prev => ({
                  ...prev,
                  brandId: newValue ? newValue.brandId : '',
                  modelId: '',
                  customModelName: ''
                }));
              }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select brand…" size="small" sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }} />
              )}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1 }}><Typography sx={lbl}>Model</Typography>
            <Autocomplete
              freeSolo
              options={models}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
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
                  setForm((prev) => ({
                    ...prev,
                    modelId: matchingOption.modelId,
                    customModelName: ''
                  }));
                } else {
                  setForm((prev) => ({
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
                  sx={{ mb: 2, '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
                />
              )}
            />
          </Box>
          <Box sx={{ flex: 1 }}><Typography sx={lbl}>Serial Number</Typography>
            <TextField fullWidth size="small" placeholder="S/N" value={form.serialNumber} onChange={handleChange('serialNumber')}
              sx={{ '& .MuiOutlinedInput-root': { fontFamily: '"JetBrains Mono", monospace', fontSize: '13px' } }} />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
