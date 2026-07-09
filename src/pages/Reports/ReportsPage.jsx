import { Box, Paper, Typography } from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const REPORT_ITEMS = [
  { key: 'device', label: 'Device Management', desc: 'View physically registered devices across the system.', icon: <Inventory2OutlinedIcon />, path: '/reports/device' },
];

export default function ReportsPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
          Reports & Analytics
        </Typography>
        <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
          View system reports, assets, and management tools.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2,
        }}
      >
        {REPORT_ITEMS.map((item) => (
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
