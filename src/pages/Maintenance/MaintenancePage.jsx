import { Box, Paper, Typography, Divider } from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined';
import PhonelinkOutlinedIcon from '@mui/icons-material/PhonelinkOutlined';
import DevicesOtherOutlinedIcon from '@mui/icons-material/DevicesOtherOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const CONFIG_ITEMS = [
  { key: 'branch', label: 'Branch', desc: 'Manage workshop locations and centers.', icon: <StorefrontOutlinedIcon />, path: '/maintenance/branch' },
  { key: 'brand', label: 'Brand', desc: 'Configure manufacturer list (Apple, Dell, etc.)', icon: <CategoryOutlinedIcon />, path: '/maintenance/brands' },
  { key: 'department', label: 'Department', desc: 'Hardware, Software, and Logistics units.', icon: <ApartmentOutlinedIcon />, path: '/maintenance/department' },
  { key: 'device', label: 'Device', desc: 'Specific hardware registry and assets.', icon: <DevicesOutlinedIcon />, path: '/maintenance/device' },
  { key: 'device-models', label: 'Device Models', desc: 'Detailed model numbers and specifications.', icon: <PhonelinkOutlinedIcon />, path: '/maintenance/device-models' },
  { key: 'device-type', label: 'Device Type', desc: 'Categorize by Laptop, Phone, Server, etc.', icon: <DevicesOtherOutlinedIcon />, path: '/maintenance/device-type' },
  { key: 'service-charges', label: 'Service Charges', desc: 'Standard labor rates and repair pricing.', icon: <PaidOutlinedIcon />, path: '/maintenance/service-charges' },
  { key: 'status', label: 'Status', desc: 'Define ticket lifecycle and repair states.', icon: <ToggleOnOutlinedIcon />, path: '/maintenance/status' },
  { key: 'ticket-type', label: 'Ticket Type', desc: 'Warranty, RMA, Out-of-warranty repairs.', icon: <ConfirmationNumberOutlinedIcon />, path: '/maintenance/ticket-type' },
];

export default function MaintenancePage() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
          Configuration Management
        </Typography>
        <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
          System-wide settings and hardware definitions.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2,
        }}
      >
        {CONFIG_ITEMS.map((item) => (
          <Paper
            key={item.key}
            elevation={1}
            sx={{
              borderRadius: '3px',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                boxShadow: '0px 4px 8px rgba(9, 30, 66, 0.08)',
              },
            }}
            onClick={() => navigate(item.path)}
          >
            <Box sx={{ p: 2.5, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box
                sx={{
                  width: 40, height: 40, borderRadius: '6px',
                  bgcolor: `${theme.palette.primary.main}10`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: theme.palette.primary.main, flexShrink: 0,
                }}
              >
                {item.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>{item.label}</Typography>
                  <ChevronRightIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                </Box>
                <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary, mt: 0.5, lineHeight: 1.5 }}>
                  {item.desc}
                </Typography>
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
