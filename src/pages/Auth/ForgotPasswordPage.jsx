import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Logo from '../../components/Logo/Logo';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ForgotPasswordPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    mobileNo: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [maskedEmail, setMaskedEmail] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!form.mobileNo.trim()) {
      setErrorMsg('Mobile Number is required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/forgot-password/send-otp', { mobileNo: form.mobileNo });
      setMaskedEmail(response.data.email);
      setSuccessMsg(response.data.message);
      setStep(2);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!form.otp.trim()) {
      setErrorMsg('OTP is required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/forgot-password/verify-otp', { 
        mobileNo: form.mobileNo, 
        otp: form.otp 
      });
      setSuccessMsg(response.data.message);
      setStep(3);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Invalid OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!form.newPassword) {
      setErrorMsg('New Password is required');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/forgot-password/reset', { 
        mobileNo: form.mobileNo, 
        newPassword: form.newPassword 
      });
      setSuccessMsg(response.data.message);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password reset successfully. Please login with your new password.' } });
      }, 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to reset password.');
      setIsLoading(false);
    }
  };

  // Aesthetic features matching login/register
  const glassEffect = {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
  };

  if (theme.palette.mode === 'dark') {
    glassEffect.background = 'rgba(20, 20, 20, 0.7)';
    glassEffect.border = '1px solid rgba(255, 255, 255, 0.08)';
  }

  const InputIconAdornment = ({ icon: Icon }) => (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      width: 40,
      color: theme.palette.text.secondary,
    }}>
      <Icon fontSize="small" />
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'light'
          ? 'radial-gradient(circle at 100% 100%, rgba(99, 102, 241, 0.1) 0%, rgba(255, 255, 255, 0) 50%), radial-gradient(circle at 0% 0%, rgba(236, 72, 153, 0.1) 0%, rgba(255, 255, 255, 0) 50%), #f8fafc'
          : 'radial-gradient(circle at 100% 100%, rgba(99, 102, 241, 0.15) 0%, rgba(0, 0, 0, 0) 50%), radial-gradient(circle at 0% 0%, rgba(236, 72, 153, 0.15) 0%, rgba(0, 0, 0, 0) 50%), #0f172a',
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
          <Logo size="large" />
        </Box>

        <Paper
          elevation={0}
          sx={{
            ...glassEffect,
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box sx={{ p: { xs: 3, sm: 5 }, pb: { xs: 2, sm: 3 } }}>
            <Typography variant="h4" fontWeight="800" gutterBottom sx={{ color: theme.palette.text.primary, letterSpacing: '-0.02em' }}>
              Reset Password
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {step === 1 && "Enter your registered mobile number to receive an OTP."}
              {step === 2 && `We've sent a 6-digit code to ${maskedEmail}`}
              {step === 3 && "Please enter your new password."}
            </Typography>

            {errorMsg && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {errorMsg}
              </Alert>
            )}

            {successMsg && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                {successMsg}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 1, mb: 4 }}>
              {[1, 2, 3].map((s) => (
                <Box
                  key={s}
                  sx={{
                    height: 4,
                    flex: 1,
                    borderRadius: 2,
                    bgcolor: s <= step ? theme.palette.primary.main : theme.palette.divider,
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </Box>

            {/* STEP 1: MOBILE NUMBER */}
            {step === 1 && (
              <form onSubmit={handleSendOtp}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1, color: theme.palette.text.primary }}>
                    Mobile Number <span style={{ color: theme.palette.error.main }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Enter your 10-digit mobile number"
                    value={form.mobileNo}
                    onChange={handleChange('mobileNo')}
                    autoFocus
                    InputProps={{
                      startAdornment: <InputIconAdornment icon={PhoneOutlinedIcon} />,
                      sx: { borderRadius: 2, bgcolor: theme.palette.background.paper }
                    }}
                  />
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  type="submit"
                  disabled={isLoading}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    fontSize: '1rem',
                  }}
                >
                  {isLoading ? 'Sending...' : 'Get OTP'}
                </Button>
              </form>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1, color: theme.palette.text.primary }}>
                    Enter OTP <span style={{ color: theme.palette.error.main }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="6-digit OTP"
                    value={form.otp}
                    onChange={handleChange('otp')}
                    autoFocus
                    InputProps={{
                      sx: { borderRadius: 2, bgcolor: theme.palette.background.paper, letterSpacing: '0.2em', textAlign: 'center' },
                      inputProps: { style: { textAlign: 'center', fontSize: '1.2rem', fontWeight: 600 } }
                    }}
                  />
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  type="submit"
                  disabled={isLoading}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    fontSize: '1rem',
                  }}
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Button>
              </form>
            )}

            {/* STEP 3: NEW PASSWORD */}
            {step === 3 && (
              <form onSubmit={handleResetPassword}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1, color: theme.palette.text.primary }}>
                    New Password <span style={{ color: theme.palette.error.main }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    type="password"
                    variant="outlined"
                    placeholder="Enter new password"
                    value={form.newPassword}
                    onChange={handleChange('newPassword')}
                    autoFocus
                    InputProps={{
                      startAdornment: <InputIconAdornment icon={LockOutlinedIcon} />,
                      sx: { borderRadius: 2, bgcolor: theme.palette.background.paper }
                    }}
                  />
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1, color: theme.palette.text.primary }}>
                    Confirm Password <span style={{ color: theme.palette.error.main }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    type="password"
                    variant="outlined"
                    placeholder="Confirm new password"
                    value={form.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    InputProps={{
                      startAdornment: <InputIconAdornment icon={LockOutlinedIcon} />,
                      sx: { borderRadius: 2, bgcolor: theme.palette.background.paper }
                    }}
                  />
                </Box>
                <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', border: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <FiberManualRecordIcon sx={{ fontSize: 8 }} /> Minimum 8 characters
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FiberManualRecordIcon sx={{ fontSize: 8 }} /> Use a mix of letters, numbers, and symbols
                  </Typography>
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  type="submit"
                  disabled={isLoading}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    fontSize: '1rem',
                  }}
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            )}

          </Box>

          {/* Footer Area */}
          <Box sx={{ 
            p: 3, 
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
            borderTop: `1px solid ${theme.palette.divider}`,
            textAlign: 'center'
          }}>
            <Typography variant="body2" color="text.secondary">
              Remembered your password?{' '}
              <Link 
                component="button"
                variant="body2"
                onClick={() => navigate('/login')}
                sx={{ 
                  fontWeight: 600, 
                  textDecoration: 'none',
                  color: theme.palette.primary.main,
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Sign in here
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
