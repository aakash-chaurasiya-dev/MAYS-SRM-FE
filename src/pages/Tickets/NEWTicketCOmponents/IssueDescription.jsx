import { Box, Typography, Autocomplete, TextField, Paper, Divider } from '@mui/material';

const PRIORITIES = ['Low', 'Normal', 'High', 'Critical'];

export default function IssueDescription({ 
  form, 
  handleChange, 
  ticketTypes, 
  referredCategories = [], 
  warrantyTypes = [], 
  lbl, 
  secHdr 
}) {
  return (
    <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
      <Box sx={secHdr}><Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Issue Description</Typography></Box>
      <Divider />
      <Box sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1 }}><Typography sx={lbl}>Priority</Typography>
            <Autocomplete
              options={PRIORITIES}
              value={form.priority}
              onChange={(e, newValue) => handleChange('priority')({ target: { value: newValue || 'Normal' } })}
              renderInput={(params) => (
                <TextField {...params} size="small" sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }} />
              )}
            />
          </Box>
          <Box sx={{ flex: 1 }}><Typography sx={lbl}>Warranty Type</Typography>
            <Autocomplete
              options={warrantyTypes}
              getOptionLabel={(option) => option.warrantyTypeName || ''}
              value={warrantyTypes.find((w) => w.warrantyTypeId === form.warrantyTypeId) || null}
              onChange={(e, newValue) => handleChange('warrantyTypeId')({ target: { value: newValue ? newValue.warrantyTypeId : '' } })}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select warranty type…" size="small" sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }} />
              )}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1 }}><Typography sx={lbl}>Referred Category</Typography>
            <Autocomplete
              options={referredCategories}
              getOptionLabel={(option) => option.referredCategoryName || ''}
              value={referredCategories.find((r) => r.referredCategoryId === form.referredCategoryId) || null}
              onChange={(e, newValue) => handleChange('referredCategoryId')({ target: { value: newValue ? newValue.referredCategoryId : '' } })}
              renderInput={(params) => (
                <TextField {...params} placeholder="Select category…" size="small" sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }} />
              )}
            />
          </Box>
          <Box sx={{ flex: 1 }}><Typography sx={lbl}>Referred Desc / Note</Typography>
            <TextField
              fullWidth size="small" placeholder="Referred description…"
              value={form.referredCategoryDecriptionTicket || ''}
              onChange={handleChange('referredCategoryDecriptionTicket')}
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
            />
          </Box>
        </Box>

        <Typography sx={lbl}>Ticket Type</Typography>
        <Autocomplete
          options={ticketTypes}
          getOptionLabel={(option) => option.ticketTypeName}
          value={ticketTypes.find((t) => t.ticketTypeId === form.ticketTypeId) || null}
          onChange={(e, newValue) => {
            handleChange('ticketTypeId')({ target: { value: newValue ? newValue.ticketTypeId : '' } });
          }}
          renderInput={(params) => (
            <TextField {...params} placeholder="Select type…" size="small" sx={{ mb: 2, '& .MuiOutlinedInput-root': { fontSize: '13px' } }} />
          )}
        />
        <Typography sx={lbl}>Issue Title</Typography>
        <TextField fullWidth size="small" placeholder="Brief summary" value={form.issueTitle}
          onChange={handleChange('issueTitle')} sx={{ mb: 2 }} />
        <Typography sx={lbl}>Description</Typography>
        <TextField fullWidth multiline rows={5} placeholder="Detailed description of the issue…"
          value={form.issueDescription} onChange={handleChange('issueDescription')}
          sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }} />
      </Box>
    </Paper>
  );
}
