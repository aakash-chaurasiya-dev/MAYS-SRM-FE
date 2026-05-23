import { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Divider, Chip,
  Stack, Avatar, IconButton, Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const TIMELINE = [
  { time: 'Oct 25, 10:32 AM', user: 'Alex Rivera', action: 'Updated diagnosis: LDO voltage regulator circuit shows visible corrosion.', type: 'update' },
  { time: 'Oct 24, 4:15 PM', user: 'Jordan Smith', action: 'Attached 3 photos from initial teardown inspection.', type: 'attachment' },
  { time: 'Oct 24, 2:00 PM', user: 'System', action: 'Ticket assigned to Alex Rivera (Hardware Division).', type: 'system' },
  { time: 'Oct 24, 1:45 PM', user: 'Sarah Jenkins', action: 'Ticket created. Device checked in at front desk.', type: 'create' },
];

const MILESTONES = [
  { label: 'Check-In', date: 'Oct 24, 2023', done: true },
  { label: 'Triage', date: 'Oct 24, 2023', done: true },
  { label: 'Diagnosis', date: 'Oct 25, 2023', done: true },
  { label: 'Repair', date: 'Pending', done: false },
  { label: 'QA Check', date: '—', done: false },
  { label: 'Ready for Pickup', date: '—', done: false },
];

export default function TicketDetailPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [internalNote, setInternalNote] = useState('');

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5,
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <IconButton size="small" onClick={() => navigate(-1)} sx={{ color: theme.palette.text.secondary }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography sx={{ fontSize: '11px', fontWeight: 600, color: theme.palette.text.secondary, letterSpacing: '0.04em' }}>
          MAIN WORKSHOP (TERMINAL A-12)
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
          MacBook Pro 16″ - Logic Board Cleaning
        </Typography>
        <Chip label="#TK-1154" size="small" sx={{ fontWeight: 600, borderRadius: '2px', bgcolor: `${theme.palette.primary.main}14`, color: theme.palette.primary.main, height: 22 }} />
        <Chip label="In Repair" size="small" sx={{ fontWeight: 600, borderRadius: '2px', bgcolor: '#0052cc14', color: '#0052cc', height: 22 }} />
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
        <Button variant="outlined" size="small" startIcon={<EditOutlinedIcon />} sx={{ fontSize: '12px' }}>Edit</Button>
        <Button variant="outlined" size="small" startIcon={<PrintOutlinedIcon />} sx={{ fontSize: '12px' }}>Print</Button>
        <IconButton size="small" sx={{ color: theme.palette.text.secondary }}><MoreVertIcon fontSize="small" /></IconButton>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
        {/* Left Column */}
        <Box sx={{ flex: 1.2 }}>
          {/* Issue Description */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{ px: 2.5, py: 1.8 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Issue Description</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <Box sx={{ bgcolor: theme.palette.background.default, borderRadius: '3px', border: `1px solid ${theme.palette.divider}`, p: 2, borderLeft: `3px solid ${theme.palette.primary.main}` }}>
                <Typography sx={{ fontSize: '13px', color: theme.palette.text.primary, lineHeight: 1.7, fontStyle: 'italic' }}>
                  "Customer reported a coffee spill on the keyboard area. The device initially turned on but shut down abruptly after 10 minutes. Now it fails to boot, though the trackpad haptic feedback is still present. No visible screen activity."
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Attachments */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{ px: 2.5, py: 1.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Attachments (3)</Typography>
              <Button size="small" sx={{ fontSize: '12px' }}>Upload</Button>
            </Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1.5}>
                {['Teardown Front', 'Logic Board', 'Corrosion Close-up'].map((alt, i) => (
                  <Box key={i} sx={{ width: 120, height: 90, borderRadius: '3px', bgcolor: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'border-color 0.15s', '&:hover': { borderColor: theme.palette.primary.main } }}>
                    <ImageOutlinedIcon sx={{ fontSize: 28, color: theme.palette.divider, mb: 0.5 }} />
                    <Typography sx={{ fontSize: '10px', color: theme.palette.text.secondary }}>{alt}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Paper>

          {/* Post Internal Update */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{ px: 2.5, py: 1.8 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Post Internal Update</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <TextField fullWidth multiline rows={3} placeholder="Add an internal note or status update…" value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }} />
              <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" size="small" startIcon={<SendOutlinedIcon />}>Post Update</Button>
              </Box>
            </Box>
          </Paper>

          {/* Activity Timeline */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.8 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Activity Timeline</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              {TIMELINE.map((entry, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: i < TIMELINE.length - 1 ? 2.5 : 0, position: 'relative' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.3 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.type === 'system' ? theme.palette.text.secondary : theme.palette.primary.main, flexShrink: 0 }} />
                    {i < TIMELINE.length - 1 && <Box sx={{ width: 1, flex: 1, bgcolor: theme.palette.divider, mt: 0.5 }} />}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>
                      <Box component="span" sx={{ fontWeight: 600 }}>{entry.user}</Box>{' — '}{entry.action}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: theme.palette.text.secondary, mt: 0.3 }}>{entry.time}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* Right Column */}
        <Box sx={{ flex: 0.8, minWidth: 280 }}>
          {/* Customer Information */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{ px: 2.5, py: 1.8, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonOutlinedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Customer Information</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: theme.palette.primary.main, fontSize: '0.85rem', fontWeight: 700 }}>JD</Avatar>
                <Box>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Johnathan Doe</Typography>
                  <Chip label="Professional Client" size="small" sx={{ fontSize: '10px', height: 18, borderRadius: '2px', bgcolor: `${theme.palette.secondary.main}14`, color: theme.palette.secondary.main }} />
                </Box>
              </Box>
              {[['Email', 'john.doe@company.com'], ['Phone', '+1 (555) 234-5678'], ['Account', 'ACC-PRO-0089']].map(([l, v]) => (
                <Box key={l} sx={{ mb: 1.2 }}>
                  <Typography sx={lbl}>{l}</Typography>
                  <Typography sx={{ fontSize: '13px' }}>{v}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Device Details */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{ px: 2.5, py: 1.8, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LaptopMacIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Device Details</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              {[['Brand', 'Apple'], ['Model', 'MacBook Pro 16″ (2023, M2 Max)'], ['Serial No.', 'C02ZW1XHMD6T'], ['Warranty', 'Expired (Out-of-Warranty)']].map(([l, v]) => (
                <Box key={l} sx={{ mb: 1.2 }}>
                  <Typography sx={lbl}>{l}</Typography>
                  <Typography sx={{ fontSize: '13px', fontFamily: l === 'Serial No.' ? '"JetBrains Mono", monospace' : 'inherit' }}>{v}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Key Milestones */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{ px: 2.5, py: 1.8, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarTodayOutlinedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Key Milestones</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              {MILESTONES.map((m, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.8 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutlinedIcon sx={{ fontSize: 16, color: m.done ? theme.palette.secondary.main : theme.palette.divider }} />
                    <Typography sx={{ fontSize: '13px', fontWeight: m.done ? 600 : 400, color: m.done ? theme.palette.text.primary : theme.palette.text.secondary }}>{m.label}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '11px', color: theme.palette.text.secondary }}>{m.date}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Operations */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.8 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Operations</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <Stack spacing={1}>
                <Button variant="contained" fullWidth size="small">Escalate to Manager</Button>
                <Button variant="outlined" fullWidth size="small">Request Parts</Button>
                <Button variant="outlined" fullWidth size="small" color="error">Mark as Critical</Button>
              </Stack>
            </Box>
          </Paper>
        </Box>
      </Stack>
    </Box>
  );
}
