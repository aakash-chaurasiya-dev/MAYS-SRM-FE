import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Divider,
  Chip,
  MenuItem,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Logo from '../../components/Logo/Logo';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function RegisterPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    mobileNo: '',
    emailId: '',
    password: '',
    confirmPassword: '',
    address: '',
    branchId: '',
  });

  const [branches, setBranches] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await api.get('/auth/branches');
        setBranches(response.data || []);
      } catch (err) {
        console.error('Failed to fetch branches', err);
        setErrorMsg('Failed to load branches list. Please refresh the page.');
      }
    };
    fetchBranches();
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    if (!form.firstName.trim()) {
      setErrorMsg('First Name is required');
      return;
    }
    if (!form.lastName.trim()) {
      setErrorMsg('Last Name is required');
      return;
    }
    if (!form.mobileNo.trim()) {
      setErrorMsg('Mobile Number is required');
      return;
    }
    if (!form.emailId.trim()) {
      setErrorMsg('Email Address is required');
      return;
    }
    if (!form.branchId) {
      setErrorMsg('Please select a Branch');
      return;
    }
    if (!form.password) {
      setErrorMsg('Password is required');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        mobileNo: form.mobileNo.trim(),
        emailId: form.emailId.trim(),
        password: form.password,
        address: form.address.trim(),
        branchId: Number(form.branchId),
      };

      await api.post('/auth/register', payload);
      setSuccessMsg('Account request submitted successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Registration error', err);
      // Retrieve the message from the API error
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const labelSx = {
    fontSize: '12px',
    fontWeight: 700,
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    mb: 0.8,
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
        <Box
          sx={{
            position: 'absolute',
            top: '30%',
            left: -80,
            width: 240,
            height: 240,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.03)',
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
          New Account Registration
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

      {/* ── Right Registration Form ── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 4,
          py: { xs: 6, md: 4 },
          overflow: 'auto',
        }}
      >
        <Paper
          elevation={2}
          sx={{
            width: '100%',
            maxWidth: 520,
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
            Create an Account
          </Typography>
          <Typography
            sx={{
              fontSize: '14px',
              color: theme.palette.text.secondary,
              mb: 2.5,
            }}
          >
            Please fill in your details to request access to the system.
          </Typography>

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3, fontSize: '13px', borderRadius: '3px' }}>
              {errorMsg}
            </Alert>
          )}

          {successMsg && (
            <Alert severity="success" sx={{ mb: 3, fontSize: '13px', borderRadius: '3px' }}>
              {successMsg}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* First Name & Last Name */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelSx}>First Name</Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. John"
                  value={form.firstName}
                  onChange={handleChange('firstName')}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}>
                          <PersonOutlinedIcon fontSize="small" />
                        </Box>
                      ),
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelSx}>Last Name</Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. Doe"
                  value={form.lastName}
                  onChange={handleChange('lastName')}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}>
                          <PersonOutlinedIcon fontSize="small" />
                        </Box>
                      ),
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Mobile Number & Email Address */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelSx}>Mobile Number</Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. 9876543210"
                  value={form.mobileNo}
                  onChange={handleChange('mobileNo')}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}>
                          <PhoneOutlinedIcon fontSize="small" />
                        </Box>
                      ),
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelSx}>Email Address</Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="john@mays.com"
                  value={form.emailId}
                  onChange={handleChange('emailId')}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}>
                          <EmailOutlinedIcon fontSize="small" />
                        </Box>
                      ),
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Branch */}
            <Typography sx={labelSx}>Branch</Typography>
            <TextField
              fullWidth
              size="small"
              select
              value={form.branchId}
              onChange={handleChange('branchId')}
              slotProps={{
                select: {
                  displayEmpty: true,
                },
                input: {
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}>
                      <BusinessOutlinedIcon fontSize="small" />
                    </Box>
                  ),
                },
              }}
              sx={{ mb: 2 }}
            >
              <MenuItem value="" disabled>
                Select your branch…
              </MenuItem>
              {branches.map((branch) => (
                <MenuItem key={branch.branchId} value={branch.branchId}>
                  {branch.branchName}
                </MenuItem>
              ))}
            </TextField>

            {/* Address */}
            <Typography sx={labelSx}>Address</Typography>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              placeholder="Enter your home/office address"
              value={form.address}
              onChange={handleChange('address')}
              slotProps={{
                input: {
                  startAdornment: (
                    <Box sx={{ mr: 1, mt: 0.5, display: 'flex', alignSelf: 'flex-start', color: theme.palette.text.secondary }}>
                      <HomeOutlinedIcon fontSize="small" />
                    </Box>
                  ),
                },
              }}
              sx={{ mb: 2 }}
            />

            {/* Password & Confirm */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3.5 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelSx}>Password</Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  placeholder="Create password"
                  value={form.password}
                  onChange={handleChange('password')}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}>
                          <LockOutlinedIcon fontSize="small" />
                        </Box>
                      ),
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelSx}>Confirm Password</Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}>
                          <LockOutlinedIcon fontSize="small" />
                        </Box>
                      ),
                    },
                  }}
                />
              </Box>
            </Box>

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
              {isLoading ? 'Registering...' : 'Register Account'}
            </Button>
          </form>

          <Typography
            sx={{
              textAlign: 'center',
              fontSize: '13px',
              color: theme.palette.text.secondary,
            }}
          >
            Already have credentials?{' '}
            <Link
              href="/login"
              underline="hover"
              sx={{ fontWeight: 600, color: theme.palette.primary.main }}
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}
            >
              Sign In
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
          <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary, mb: 1 }}>
            © 2024 Mays Computer Repair & Solutions. All rights reserved.
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
