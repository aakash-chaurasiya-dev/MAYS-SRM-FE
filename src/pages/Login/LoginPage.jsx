import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Divider,
  Chip,
  Alert,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import Logo from '../../components/Logo/Logo';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [mobileNo, setMobileNo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Where to redirect after login (default to /dashboard)
  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Pre-flight validation
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobileNo)) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }
    // if (password.length < 8) {
    //   setError('Password must be at least 8 characters long.');
    //   return;
    // }

    setIsLoading(true);

    // Call the login function from AuthContext
    const result = await login({ mobileNo, password });

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || 'Failed to login');
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        bgcolor: '#f4f5f7',
      }}
    >
      {/* ── Left Brand Panel ── */}
      <Box
        sx={{
          width: { xs: '100%', md: '45%' },
          minWidth: { xs: '100%', md: 400 },
          bgcolor: theme.palette.primary.main,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          px: 6,
          py: { xs: 6, md: 0 },
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.06)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -40,
            left: -40,
            width: 160,
            height: 160,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.04)',
          }}
        />

        <Box sx={{ mb: 4, zIndex: 1 }}>
          <Logo variant="full" mode="dark" />
        </Box>
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '14px',
            fontWeight: 400,
            textAlign: 'center',
            maxWidth: 300,
            lineHeight: 1.6,
          }}
        >
          Authorized Technician Terminal
        </Typography>

        <Divider
          sx={{
            width: 60,
            mt: 4,
            mb: 3,
            borderColor: 'rgba(255,255,255,0.2)',
            borderWidth: '1.5px',
          }}
        />

        <Typography
          sx={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Mays Computer Repair & Solutions
        </Typography>
      </Box>

      {/* ── Right Login Form ── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 4,
          py: { xs: 6, md: 0 },
        }}
      >
        <Paper
          elevation={2}
          sx={{
            width: '100%',
            maxWidth: 420,
            p: 5,
            borderRadius: '4px',
          }}
        >
          <Typography
            sx={{
              fontSize: '20px',
              fontWeight: 600,
              color: theme.palette.text.primary,
              mb: 0.5,
            }}
          >
            Sign In
          </Typography>
          <Typography
            sx={{
              fontSize: '14px',
              color: theme.palette.text.secondary,
              mb: 3.5,
            }}
          >
            Enter your credentials to access the repair terminal
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            {/* Mobile Number */}
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 700,
                color: theme.palette.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                mb: 0.8,
              }}
            >
              Mobile Number
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. 9876543210"
              value={mobileNo}
              onChange={(e) => setMobileNo(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}>
                      <PhoneOutlinedIcon fontSize="small" />
                    </Box>
                  ),
                },
              }}
              sx={{ mb: 2.5 }}
            />

            {/* Password */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: theme.palette.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Password
              </Typography>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/forgot-password')}
                underline="hover"
                sx={{ fontSize: '12px', fontWeight: 600, color: theme.palette.primary.main }}
              >
                Forgot?
              </Link>
            </Box>
            <TextField
              fullWidth
              size="small"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}>
                      <LockOutlinedIcon fontSize="small" />
                    </Box>
                  ),
                },
              }}
              sx={{ mb: 3.5 }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading}
              sx={{
                py: 1.2,
                fontSize: '14px',
                fontWeight: 600,
                mb: 2,
              }}
            >
              {isLoading ? 'Signing In...' : 'Sign In to Terminal'}
            </Button>

            <Button
              variant="outlined"
              fullWidth
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                py: 1.2,
                fontSize: '14px',
                fontWeight: 600,
                mb: 2,
              }}
            >
              Register New Account
            </Button>
          </form>

          <Typography
            sx={{
              textAlign: 'center',
              fontSize: '13px',
              color: theme.palette.text.secondary,
            }}
          >
            New user?{' '}
            <Link
              href="/register"
              underline="hover"
              sx={{ fontWeight: 600, color: theme.palette.primary.main }}
              onClick={(e) => {
                e.preventDefault();
                navigate('/register');
              }}
            >
              Register here
            </Link>
          </Typography>
        </Paper>

        {/* ── Station Info ── */}
        <Box sx={{ display: 'flex', gap: 3, mt: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Chip
            icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important' }} />}
            label="STATION ID: MAIN-SHOP-01"
            size="small"
            sx={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '3px',
              color: theme.palette.text.secondary,
              '& .MuiChip-icon': { color: theme.palette.text.secondary },
            }}
          />
          <Chip
            icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important', color: '#006c47 !important' }} />}
            label="SYSTEM STATUS: OPERATIONAL"
            size="small"
            sx={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '3px',
              color: theme.palette.text.secondary,
            }}
          />
        </Box>

        {/* ── Footer ── */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary, mb: 1, maxWidth: 400 }}>
            Access restricted to authorized personnel. All session data is logged and monitored for security compliance under internal protocol TK-GLOBAL.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Link href="#" underline="hover" sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
              Privacy Policy
            </Link>
            <Link href="#" underline="hover" sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
              Support Desk
            </Link>
            <Link href="#" underline="hover" sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
              Compliance
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}