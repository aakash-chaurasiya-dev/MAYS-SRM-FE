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
  MenuItem,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Logo from '../../components/Logo/Logo';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useNavigate } from 'react-router-dom';

const DEPARTMENTS = [
  'Hardware Repair',
  'Software Support',
  'Data Recovery',
  'Logistics',
  'Quality Assurance',
  'Customer Relations',
];

export default function RegisterPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    employeeId: '',
    email: '',
    department: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder — navigate to login after registration
    navigate('/login');
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
          New Account Request
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
            maxWidth: 480,
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
            Request Access
          </Typography>
          <Typography
            sx={{
              fontSize: '14px',
              color: theme.palette.text.secondary,
              mb: 1.5,
            }}
          >
            Submission will be reviewed by Terminal A-12 administrators within 24 hours.
          </Typography>

          <Alert
            severity="info"
            icon={<InfoOutlinedIcon sx={{ fontSize: 18 }} />}
            sx={{
              mb: 3,
              fontSize: '12px',
              borderRadius: '3px',
              '& .MuiAlert-message': { fontSize: '12px' },
            }}
          >
            Access to the TechFlow Repair terminal is restricted to authorized employees. Your request will be logged and audited.
          </Alert>

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <Typography sx={labelSx}>Full Name</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. John Doe"
              value={form.fullName}
              onChange={handleChange('fullName')}
              slotProps={{
                input: {
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}>
                      <PersonOutlinedIcon fontSize="small" />
                    </Box>
                  ),
                },
              }}
              sx={{ mb: 2 }}
            />

            {/* Employee ID & Email — side by side */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelSx}>Employee ID</Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. TECH-0042"
                  value={form.employeeId}
                  onChange={handleChange('employeeId')}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}>
                          <BadgeOutlinedIcon fontSize="small" />
                        </Box>
                      ),
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelSx}>Email</Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="john@mays.com"
                  value={form.email}
                  onChange={handleChange('email')}
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

            {/* Department */}
            <Typography sx={labelSx}>Department</Typography>
            <TextField
              fullWidth
              size="small"
              select
              value={form.department}
              onChange={handleChange('department')}
              sx={{ mb: 2 }}
            >
              <MenuItem value="" disabled>
                Select department…
              </MenuItem>
              {DEPARTMENTS.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </TextField>

            {/* Password & Confirm */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
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
              sx={{
                py: 1.2,
                fontSize: '14px',
                fontWeight: 600,
                mb: 2,
              }}
            >
              Submit Request
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
            <Link href="#" underline="hover" sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
              Internal Portal
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
