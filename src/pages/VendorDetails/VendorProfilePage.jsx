import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Card, CardContent, Divider, CircularProgress,
  Avatar, useTheme, Chip, Stack, Tabs, Tab
} from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import api from '../../services/api';
import VendorTicketsTab from './VendorTicketsTab';
import VendorUsersTab from './VendorUsersTab';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>{children}</Box> : null;
}

export default function VendorProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  // ── 1. Fetch Vendor Details ───────────────────────────────────
  const { data: vendor, isLoading: loadingVendor } = useQuery({
    queryKey: ['vendor', id],
    queryFn: async () => {
      const res = await api.get(`/vendors/${id}`);
      return res.data?.data || res.data;
    },
    staleTime: 60 * 60 * 1000,
  });

  // ── 2. Fetch Vendor's Tickets ─────────────────────────────────
  const { data: rawTickets = [], isLoading: loadingTickets } = useQuery({
    queryKey: ['vendorTickets', id],
    queryFn: async () => {
      const res = await api.get(`/tickets/vendor/${id}`);
      return res.data?.data || res.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── 3. Fetch Vendor Users ─────────────────────────────────────
  const { data: vendorUsers = [], isLoading: loadingVendorUsers } = useQuery({
    queryKey: ['vendorUsers', id],
    queryFn: async () => {
      const res = await api.get(`/vendor-users/vendor/${id}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Sort tickets newest first
  const tickets = React.useMemo(() => {
    return [...rawTickets].sort((a, b) => {
      if (!a.createdDate) return 1;
      if (!b.createdDate) return -1;
      return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
    });
  }, [rawTickets]);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  };

  if (loadingVendor) {
    return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
  }

  if (!vendor) {
    return <Box p={4}><Typography>Vendor not found.</Typography></Box>;
  }

  const initials = vendor.name?.charAt(0)?.toUpperCase() || 'V';
  const isActive = vendor.isActive !== false;

  return (
    <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 100px)', overflow: 'hidden' }}>

      {/* ── Left Panel: Vendor Details (35%) ── */}
      <Box sx={{ width: '35%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3, overflow: 'auto' }}>

          {/* Avatar + Name */}
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Avatar sx={{ width: 100, height: 100, mb: 2, bgcolor: theme.palette.primary.dark, fontSize: '2.5rem' }}>
              {initials}
            </Avatar>
            <Typography variant="h5" fontWeight="bold" align="center">{vendor.name}</Typography>
            <Typography variant="body2" color="text.secondary">{vendor.email || 'No Email'}</Typography>
            <Chip
              label={isActive ? 'Active Vendor' : 'Inactive Vendor'}
              size="small"
              sx={{
                mt: 1.5, fontWeight: 600,
                bgcolor: isActive ? `${theme.palette.success.main}1A` : `${theme.palette.error.main}1A`,
                color: isActive ? 'success.main' : 'error.main'
              }}
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Info Fields */}
          <CardContent sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {[
              ['Mobile No', vendor.mobileNo],
              ['Email', vendor.email],
              ['Address', vendor.address],
              ['Description', vendor.description],
              ['Role', vendor.roleName],
            ].filter(([, v]) => v).map(([label, value]) => (
              <Box key={label}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">{label}</Typography>
                <Typography variant="body1" fontWeight={500}>{value || 'N/A'}</Typography>
              </Box>
            ))}

            {/* Stats */}
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box textAlign="center">
                <Typography variant="h5" fontWeight={700} color="primary.main">{tickets.length}</Typography>
                <Typography variant="caption" color="text.secondary">Tickets</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h5" fontWeight={700} color="secondary.main">{vendorUsers.length}</Typography>
                <Typography variant="caption" color="text.secondary">Users</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* ── Right Panel: Tabbed (65%) ── */}
      <Box sx={{ width: '65%', display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
        <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Tab Header */}
          <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, px: 2, pt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ minHeight: 40 }}>
              <Tab
                icon={<ConfirmationNumberOutlinedIcon fontSize="small" />}
                iconPosition="start"
                label="Tickets"
                sx={{ minHeight: 40, fontSize: '13px', fontWeight: 600 }}
              />
              <Tab
                icon={<PersonOutlinedIcon fontSize="small" />}
                iconPosition="start"
                label="Vendor Users"
                sx={{ minHeight: 40, fontSize: '13px', fontWeight: 600 }}
              />
            </Tabs>
            <Chip
              label={activeTab === 0 ? `${tickets.length} Tickets` : `${vendorUsers.length} Users`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>

          {/* ── Tab 0: Tickets ── */}
          <TabPanel value={activeTab} index={0}>
            <VendorTicketsTab tickets={tickets} loading={loadingTickets} />
          </TabPanel>

          {/* ── Tab 1: Vendor Users ── */}
          <TabPanel value={activeTab} index={1}>
            <VendorUsersTab vendorId={id} vendorUsers={vendorUsers} loading={loadingVendorUsers} />
          </TabPanel>

        </Card>
      </Box>
    </Box>
  );
}
