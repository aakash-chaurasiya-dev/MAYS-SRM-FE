import { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Divider,
  MenuItem, Stack,
} from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import DesktopWindowsOutlinedIcon from '@mui/icons-material/DesktopWindowsOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import Tabs from '../../stereotype/Tabs/Tabs';

const DEVICE_TYPES = ['Laptop', 'Desktop', 'Phone', 'Tablet', 'Server', 'Other'];
const PRIORITIES = ['Low', 'Normal', 'High', 'Critical'];
const TICKET_TYPES = ['Warranty', 'RMA', 'Out-of-Warranty', 'Internal'];

const OPEN_TICKETS = [
  { id: 'tk102', label: 'TK-102: MacBook Air', icon: <LaptopMacIcon />, removable: true },
  { id: 'tk105', label: 'TK-105: Dell XPS', icon: <DesktopWindowsOutlinedIcon />, removable: true },
  { id: 'tk109', label: 'TK-109: HP Spectre', icon: <LaptopMacIcon />, removable: false },
];

export default function NewTicketPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tk109');
  const [tabs, setTabs] = useState(OPEN_TICKETS);
  const [form, setForm] = useState({
    customerName: '', phone: '', email: '', customerType: 'Walk-in',
    brand: '', model: '', serialNumber: '', deviceType: '',
    priority: 'Normal', ticketType: '', issueTitle: '', issueDescription: '',
  });

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleTabClose = (tabId) => {
    setTabs((prev) => prev.filter((t) => t.id !== tabId));
    if (activeTab === tabId && tabs.length > 1)
      setActiveTab(tabs[0].id === tabId ? tabs[1].id : tabs[0].id);
  };

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.8,
  };

  const secHdr = { px: 2.5, py: 1.8, bgcolor: `${theme.palette.primary.main}06` };

  return (
    <Box>
      <Box sx={{ mx: -3, mt: -3, mb: 3 }}>
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}
          onTabClose={handleTabClose} showAddButton addTooltip="New Ticket" />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
          Intake New Repair Ticket
        </Typography>
        <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
          Fill in the details below to initialize a service request for a new device.
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
        <Box sx={{ flex: 1 }}>
          {/* Customer Details */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
            <Box sx={secHdr}><Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Customer Details</Typography></Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <Typography sx={lbl}>Customer Name</Typography>
              <TextField fullWidth size="small" placeholder="Full name" value={form.customerName}
                onChange={handleChange('customerName')}
                slotProps={{ input: { startAdornment: <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}><PersonOutlinedIcon fontSize="small" /></Box> } }}
                sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={lbl}>Phone</Typography>
                  <TextField fullWidth size="small" placeholder="+1 (555) 000-0000" value={form.phone}
                    onChange={handleChange('phone')}
                    slotProps={{ input: { startAdornment: <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}><PhoneOutlinedIcon fontSize="small" /></Box> } }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={lbl}>Email</Typography>
                  <TextField fullWidth size="small" placeholder="customer@email.com" value={form.email}
                    onChange={handleChange('email')}
                    slotProps={{ input: { startAdornment: <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}><EmailOutlinedIcon fontSize="small" /></Box> } }} />
                </Box>
              </Box>
              <Typography sx={lbl}>Customer Type</Typography>
              <TextField fullWidth size="small" select value={form.customerType} onChange={handleChange('customerType')}>
                {['Walk-in', 'Professional Client', 'Corporate Account', 'Government'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Box>
          </Paper>

          {/* Device Information */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden' }}>
            <Box sx={secHdr}><Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Device Information</Typography></Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}><Typography sx={lbl}>Brand</Typography>
                  <TextField fullWidth size="small" placeholder="e.g. Apple" value={form.brand} onChange={handleChange('brand')} /></Box>
                <Box sx={{ flex: 1 }}><Typography sx={lbl}>Model</Typography>
                  <TextField fullWidth size="small" placeholder="e.g. MacBook Pro" value={form.model} onChange={handleChange('model')} /></Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}><Typography sx={lbl}>Serial Number</Typography>
                  <TextField fullWidth size="small" placeholder="S/N" value={form.serialNumber} onChange={handleChange('serialNumber')}
                    sx={{ '& .MuiOutlinedInput-root': { fontFamily: '"JetBrains Mono", monospace', fontSize: '13px' } }} /></Box>
                <Box sx={{ flex: 1 }}><Typography sx={lbl}>Device Type</Typography>
                  <TextField fullWidth size="small" select value={form.deviceType} onChange={handleChange('deviceType')}>
                    <MenuItem value="" disabled>Select type…</MenuItem>
                    {DEVICE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField></Box>
              </Box>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ flex: 1 }}>
          {/* Issue Description */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
            <Box sx={secHdr}><Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Issue Description</Typography></Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}><Typography sx={lbl}>Priority</Typography>
                  <TextField fullWidth size="small" select value={form.priority} onChange={handleChange('priority')}>
                    {PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                  </TextField></Box>
                <Box sx={{ flex: 1 }}><Typography sx={lbl}>Ticket Type</Typography>
                  <TextField fullWidth size="small" select value={form.ticketType} onChange={handleChange('ticketType')}>
                    <MenuItem value="" disabled>Select…</MenuItem>
                    {TICKET_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField></Box>
              </Box>
              <Typography sx={lbl}>Issue Title</Typography>
              <TextField fullWidth size="small" placeholder="Brief summary" value={form.issueTitle}
                onChange={handleChange('issueTitle')} sx={{ mb: 2 }} />
              <Typography sx={lbl}>Description</Typography>
              <TextField fullWidth multiline rows={5} placeholder="Detailed description of the issue…"
                value={form.issueDescription} onChange={handleChange('issueDescription')}
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }} />
            </Box>
          </Paper>

          {/* Upload */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
            <Box sx={secHdr}><Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Upload Attachments</Typography></Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <Box sx={{ border: `2px dashed ${theme.palette.divider}`, borderRadius: '3px', p: 4, textAlign: 'center',
                cursor: 'pointer', transition: 'border-color 0.2s', '&:hover': { borderColor: theme.palette.primary.main } }}>
                <CloudUploadOutlinedIcon sx={{ fontSize: 40, color: theme.palette.text.secondary, mb: 1 }} />
                <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>Drop device photos, warranty PDFs, or invoices here.</Typography>
                <Typography sx={{ fontSize: '11px', color: theme.palette.text.secondary, mt: 0.5 }}>JPG, PNG, PDF up to 10MB each</Typography>
              </Box>
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button variant="outlined" startIcon={<CloseIcon />} onClick={() => navigate('/dashboard')} sx={{ px: 3 }}>Cancel</Button>
            <Button variant="contained" startIcon={<SaveOutlinedIcon />} sx={{ px: 3 }}>Create Ticket</Button>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
