import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Avatar, 
  Grid, 
  Divider, 
  CircularProgress,
  Alert,
  TextField,
  Button,
  Stack
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfilePage() {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    employeeName: '',
    mobileNo: '',
    emailId: '',
    email: '',
    address: '',
    vendor: '',
    pincode: '',
    city: '',
  });

  const isEmployee = profileData && profileData.employeeId !== undefined;

  const handleEditClick = () => {
    setForm({
      firstName: profileData.firstName || '',
      lastName: profileData.lastName || '',
      employeeName: profileData.employeeName || '',
      mobileNo: profileData.mobileNo || '',
      emailId: profileData.emailId || '',
      email: profileData.email || '',
      address: profileData.address || '',
      vendor: profileData.vendor || '',
      pincode: profileData.pincode || '',
      city: profileData.city || '',
    });
    setIsEditMode(true);
  };

  const handleFieldChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      
      const payload = isEmployee ? {
        employeeName: form.employeeName,
        mobileNo: form.mobileNo,
        email: form.email,
        address: form.address,
        vendor: form.vendor,
        pincode: form.pincode,
        city: form.city,
      } : {
        firstName: form.firstName,
        lastName: form.lastName,
        mobileNo: form.mobileNo,
        emailId: form.emailId,
        address: form.address,
      };

      await api.put('/auth/me', payload);

      if (form.mobileNo !== profileData.mobileNo) {
        window.dispatchEvent(new CustomEvent('app-notification', {
          detail: { message: 'Mobile number changed. Logging out for security...', severity: 'warning' }
        }));
        setTimeout(() => {
          logout();
        }, 1500);
        return;
      }

      const response = await api.get('/auth/me');
      setProfileData(response.data);
      setIsEditMode(false);
      
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: { message: 'Profile updated successfully!', severity: 'success' }
      }));
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.message || 'Failed to save profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/me');
        setProfileData(response.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const name = isEmployee ? profileData.employeeName : `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim();
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  
  // Sourced from Auth context. Non-employees are always 'USER'
  const rawRole = user?.roles?.[0]?.authority || user?.role || 'ROLE_USER';
  const role = isEmployee ? rawRole.replace('ROLE_', '') : 'USER';

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 800, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ color: theme.palette.text.primary, mb: 0 }}>
          My Profile
        </Typography>
        {!isEditMode ? (
          <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={handleEditClick}>
            Edit Profile
          </Button>
        ) : (
          <Stack direction="row" spacing={1.5}>
            <Button variant="text" startIcon={<CloseIcon />} onClick={() => setIsEditMode(false)}>
              Cancel
            </Button>
            <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={handleSave}>
              Save Changes
            </Button>
          </Stack>
        )}
      </Box>
      
      <Card sx={{ borderRadius: 2, boxShadow: theme.shadows[2] }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {isEditMode ? (
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={600}>
                Edit Personal Information
              </Typography>
              
              {isEmployee ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Employee Name"
                      size="small"
                      value={form.employeeName}
                      onChange={handleFieldChange('employeeName')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Mobile Number"
                      size="small"
                      value={form.mobileNo}
                      onChange={handleFieldChange('mobileNo')}
                      helperText="Warning: Changing mobile number will log you out."
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      size="small"
                      value={form.email}
                      onChange={handleFieldChange('email')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Vendor"
                      size="small"
                      value={form.vendor}
                      onChange={handleFieldChange('vendor')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="City"
                      size="small"
                      value={form.city}
                      onChange={handleFieldChange('city')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Pincode"
                      size="small"
                      value={form.pincode}
                      onChange={handleFieldChange('pincode')}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Address"
                      size="small"
                      value={form.address}
                      onChange={handleFieldChange('address')}
                    />
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      size="small"
                      value={form.firstName}
                      onChange={handleFieldChange('firstName')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      size="small"
                      value={form.lastName}
                      onChange={handleFieldChange('lastName')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Mobile Number"
                      size="small"
                      value={form.mobileNo}
                      onChange={handleFieldChange('mobileNo')}
                      helperText="Warning: Changing mobile number will log you out."
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      size="small"
                      value={form.emailId}
                      onChange={handleFieldChange('emailId')}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Address"
                      size="small"
                      value={form.address}
                      onChange={handleFieldChange('address')}
                    />
                  </Grid>
                </Grid>
              )}
            </Stack>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 3, flexWrap: 'wrap' }}>
                <Avatar 
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    fontSize: '2.5rem', 
                    bgcolor: theme.palette.primary.main 
                  }}
                >
                  {initials}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {name}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                    {role}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'inline-block', px: 1.5, py: 0.5, bgcolor: profileData.isActive ? 'success.light' : 'error.light', color: 'white', borderRadius: 1, fontSize: '0.75rem', fontWeight: 600 }}>
                    {profileData.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Contact Information
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Mobile Number</Typography>
                  <Typography variant="body1" fontWeight={500}>{profileData.mobileNo || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Email Address</Typography>
                  <Typography variant="body1" fontWeight={500}>{profileData.email || profileData.emailId || 'N/A'}</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Address</Typography>
                  <Typography variant="body1" fontWeight={500}>{profileData.address || 'N/A'}</Typography>
                </Grid>

                {isEmployee && (
                  <>
                    {profileData.city && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">City</Typography>
                        <Typography variant="body1" fontWeight={500}>{profileData.city}</Typography>
                      </Grid>
                    )}
                    {profileData.pincode && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Pincode</Typography>
                        <Typography variant="body1" fontWeight={500}>{profileData.pincode}</Typography>
                      </Grid>
                    )}
                    {profileData.departmentName && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Department</Typography>
                        <Typography variant="body1" fontWeight={500}>{profileData.departmentName}</Typography>
                      </Grid>
                    )}
                    {profileData.vendor && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Vendor</Typography>
                        <Typography variant="body1" fontWeight={500}>{profileData.vendor}</Typography>
                      </Grid>
                    )}
                  </>
                )}

                {!isEmployee && profileData.branchName && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Branch</Typography>
                    <Typography variant="body1" fontWeight={500}>{profileData.branchName}</Typography>
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
