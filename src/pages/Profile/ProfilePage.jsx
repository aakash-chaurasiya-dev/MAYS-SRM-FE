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
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfilePage() {
  const theme = useTheme();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  // Handle both Employee and UserMaster differences
  const isEmployee = profileData.employeeId !== undefined;
  
  const name = isEmployee ? profileData.employeeName : `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim();
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  
  // Sourced from Auth context. Non-employees are always 'USER'
  const rawRole = user?.roles?.[0]?.authority || user?.role || 'ROLE_USER';
  const role = isEmployee ? rawRole.replace('ROLE_', '') : 'USER';

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 800, margin: '0 auto' }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 4, color: theme.palette.text.primary }}>
        My Profile
      </Typography>
      
      <Card sx={{ borderRadius: 2, boxShadow: theme.shadows[2] }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
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
            
            {profileData.address && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Address</Typography>
                <Typography variant="body1" fontWeight={500}>{profileData.address}</Typography>
              </Grid>
            )}

            {isEmployee && profileData.departmentName && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Department</Typography>
                <Typography variant="body1" fontWeight={500}>{profileData.departmentName}</Typography>
              </Grid>
            )}

            {isEmployee && profileData.vendor && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Vendor</Typography>
                <Typography variant="body1" fontWeight={500}>{profileData.vendor || 'N/A'}</Typography>
              </Grid>
            )}

            {!isEmployee && profileData.branchName && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Branch</Typography>
                <Typography variant="body1" fontWeight={500}>{profileData.branchName}</Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
