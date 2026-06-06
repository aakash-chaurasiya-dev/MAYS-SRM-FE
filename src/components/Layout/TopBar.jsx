import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Badge,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';

export default function TopBar({ onMenuClick }) {
  const theme = useTheme();
  const { user } = useAuth();

  // Dynamically extract user details from the decoded JWT token
  // Using fallbacks in case the JWT does not contain these specific properties
  const userName = user?.name || 'NA';
  const userRole = user?.role || 'N/A';
  const userInitials = userName.substring(0, 2).toUpperCase();

  return (
    <Box
      component="header"
      sx={{
        height: 56,
        minHeight: 56,
        bgcolor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        px: { xs: 2, sm: 3 },
        gap: { xs: 1, sm: 2 },
      }}
    >
      {/* ── Hamburger Menu ── */}
      <IconButton
        color="inherit"
        aria-label="toggle drawer"
        edge="start"
        onClick={onMenuClick}
        sx={{ mr: 1, color: theme.palette.text.secondary }}
      >
        <MenuIcon />
      </IconButton>

      {/* ── Search ── */}
      <TextField
        size="small"
        placeholder="Search tickets, parts…"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          display: { xs: 'none', sm: 'flex' },
          width: 360,
          '& .MuiOutlinedInput-root': {
            borderRadius: '3px',
            bgcolor: theme.palette.background.default,
            '& fieldset': { borderColor: theme.palette.divider },
          },
        }}
      />
      {/* Mobile Search Icon */}
      <IconButton size="small" sx={{ display: { xs: 'inline-flex', sm: 'none' }, color: theme.palette.text.secondary }}>
        <SearchIcon fontSize="small" />
      </IconButton>

      <Box sx={{ flex: 1 }} />

      {/* ── Actions ── */}
      <Tooltip title="Help">
        <IconButton size="small" sx={{ color: theme.palette.text.secondary, display: { xs: 'none', sm: 'inline-flex' } }}>
          <HelpOutlineOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Notifications">
        <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
          <Badge badgeContent={3} color="error" variant="dot">
            <NotificationsNoneOutlinedIcon fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* ── User avatar ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: { xs: 0, sm: 1 } }}>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            fontSize: '0.8rem',
            fontWeight: 700,
            bgcolor: theme.palette.primary.main,
          }}
        >
          {userInitials}
        </Avatar>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.2 }}>
            {userName}
          </Typography>
          <Typography sx={{ fontSize: '11px', color: theme.palette.text.secondary, lineHeight: 1.2 }}>
            {userRole}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
