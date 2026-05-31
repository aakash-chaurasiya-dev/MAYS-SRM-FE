import { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Chip, Divider,
  Stack, LinearProgress, IconButton, Avatar,
} from '@mui/material';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { useTheme } from '@mui/material/styles';

const pendingParts = [
  { name: 'Logic Board Cleaner', status: 'In Transit', expected: 'Exp. Oct 27' },
  { name: 'USB-C Port Assembly', status: 'Ordered', expected: 'Exp. Oct 30' },
];

const componentHealth = [
  { name: 'Display Assembly', health: 92, status: 'Good' },
  { name: 'Battery', health: 78, status: 'Fair' },
  { name: 'Logic Board', health: 15, status: 'Critical' },
  { name: 'SSD Storage', health: 95, status: 'Good' },
  { name: 'Keyboard / Trackpad', health: 88, status: 'Good' },
];

export default function DiagnosisPage() {
  const theme = useTheme();
  const [remarks, setRemarks] = useState(
    'Device does not power on. Liquid indicators near the USB-C ports are triggered. Visible residue on the LDO voltage regulator circuit.'
  );

  const getHealthColor = (v) => {
    if (v >= 80) return '#006c47';
    if (v >= 50) return '#B95000';
    return '#ba1a1a';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
            MacBook Air M2 — Liquid Damage Diagnosis
          </Typography>
          <Chip label="TK-4515" size="small" sx={{ fontWeight: 600, borderRadius: '2px', bgcolor: `${theme.palette.primary.main}14`, color: theme.palette.primary.main, height: 22 }} />
        </Box>
        <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
          Customer: Jonathan Wick • Check-in: Oct 24, 2023
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
        {/* Left Column */}
        <Box sx={{ flex: 1 }}>
          {/* Photo Upload */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{ px: 2.5, py: 1.8, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhotoCameraOutlinedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Upload Photos</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <Box
                sx={{
                  border: `2px dashed ${theme.palette.divider}`,
                  borderRadius: '3px',
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: theme.palette.primary.main },
                }}
              >
                <AddOutlinedIcon sx={{ fontSize: 32, color: theme.palette.text.secondary, mb: 1 }} />
                <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
                  Drag photos here or click to upload
                </Typography>
                <Typography sx={{ fontSize: '11px', color: theme.palette.text.secondary, mt: 0.5 }}>
                  JPG, PNG up to 10MB each
                </Typography>
              </Box>
              {/* Thumbnail placeholders */}
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                {[1, 2, 3].map((i) => (
                  <Box key={i} sx={{ width: 72, height: 72, borderRadius: '3px', bgcolor: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PhotoCameraOutlinedIcon sx={{ fontSize: 20, color: theme.palette.divider }} />
                  </Box>
                ))}
              </Stack>
            </Box>
          </Paper>

          {/* Diagnosis Remarks */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.8, display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryEduOutlinedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Diagnosis Remarks</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <TextField
                multiline
                rows={5}
                fullWidth
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
              />
              <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" size="small">Save Remarks</Button>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Right Column */}
        <Box sx={{ flex: 1 }}>
          {/* Part Request Form */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{ px: 2.5, py: 1.8, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShoppingCartOutlinedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Part Request Form</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: theme.palette.text.secondary, mb: 0.8 }}>Part Name</Typography>
              <TextField fullWidth size="small" placeholder="e.g. Logic Board Assembly" sx={{ mb: 2 }} />
              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: theme.palette.text.secondary, mb: 0.8 }}>Quantity</Typography>
                  <TextField fullWidth size="small" type="number" defaultValue={1} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: theme.palette.text.secondary, mb: 0.8 }}>Priority</Typography>
                  <TextField fullWidth size="small" defaultValue="Normal" select slotProps={{ select: { native: true } }}>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </TextField>
                </Box>
              </Stack>
              <Button variant="contained" size="small" startIcon={<AddOutlinedIcon />} sx={{ mt: 2 }}>Submit Request</Button>
            </Box>
            {/* Pending items */}
            <Divider />
            <Box sx={{ px: 2.5, py: 1.5 }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: theme.palette.text.secondary, mb: 1 }}>Pending Items</Typography>
              {pendingParts.map((p, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.8 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalShippingOutlinedIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                    <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>{p.name}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip label={p.status} size="small" sx={{ fontSize: '10px', fontWeight: 600, borderRadius: '2px', height: 20, bgcolor: `${theme.palette.primary.main}14`, color: theme.palette.primary.main }} />
                    <Typography sx={{ fontSize: '10px', color: theme.palette.text.secondary }}>{p.expected}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Component Health */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.8, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AnalyticsOutlinedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Component Health</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              {componentHealth.map((c, i) => (
                <Box key={i} sx={{ mb: i < componentHealth.length - 1 ? 1.8 : 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>{c.name}</Typography>
                    <Chip label={c.status} size="small" sx={{ fontSize: '10px', fontWeight: 700, borderRadius: '2px', height: 20, bgcolor: `${getHealthColor(c.health)}14`, color: getHealthColor(c.health) }} />
                  </Box>
                  <LinearProgress variant="determinate" value={c.health} sx={{ height: 6, borderRadius: 3, bgcolor: `${getHealthColor(c.health)}10`, '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: getHealthColor(c.health) } }} />
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </Stack>
    </Box>
  );
}
