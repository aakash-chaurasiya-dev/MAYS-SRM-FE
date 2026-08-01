import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Card, CardContent, Divider, CircularProgress,
  Avatar, useTheme, Chip, Stack, Tabs, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import api from '../../services/api';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>{children}</Box> : null;
}

export default function VendorProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams();
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
  const tickets = useMemo(() => {
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
            {loadingTickets ? (
              <Box display="flex" justifyContent="center" pt={4}><CircularProgress /></Box>
            ) : tickets.length === 0 ? (
              <Typography color="text.secondary" align="center" mt={4}>No tickets found for this vendor.</Typography>
            ) : (
              <Stack spacing={2}>
                {tickets.map(ticket => (
                  <Card
                    key={ticket.ticketId}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2, cursor: 'pointer', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: theme.shadows[3] } }}
                    onClick={() => navigate(`/tickets/${ticket.ticketId}`)}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                        {`TK-${ticket.ticketId}`} — {ticket.ticketDescription
                          ? ticket.ticketDescription.substring(0, 45) + (ticket.ticketDescription.length > 45 ? '…' : '')
                          : ticket.ticketTypeName || `Ticket #${ticket.ticketId}`}
                      </Typography>
                      <Chip
                        label={ticket.ticketStatusName || 'OPEN'}
                        size="small"
                        sx={{
                          fontWeight: 'bold', fontSize: '0.7rem',
                          bgcolor: ticket.ticketStatusName === 'CLOSED' ? `${theme.palette.error.main}1A` : `${theme.palette.success.main}1A`,
                          color: ticket.ticketStatusName === 'CLOSED' ? 'error.main' : 'success.main'
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      <strong>Customer:</strong> {[ticket.userFirstName, ticket.userLastName].filter(Boolean).join(' ') || 'N/A'} &nbsp;|&nbsp;
                      <strong>Type:</strong> {ticket.ticketTypeName || 'N/A'}
                    </Typography>
                    <Box display="flex" gap={4}>
                      <Box>
                        <Typography variant="caption" color="text.disabled" display="block">Created</Typography>
                        <Typography variant="body2" fontWeight={500}>{formatDateTime(ticket.createdDate)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.disabled" display="block">Target Date</Typography>
                        <Typography variant="body2" fontWeight={500}>{formatDateTime(ticket.targetDate)}</Typography>
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Stack>
            )}
          </TabPanel>

          {/* ── Tab 1: Vendor Users ── */}
          <TabPanel value={activeTab} index={1}>
            {loadingVendorUsers ? (
              <Box display="flex" justifyContent="center" pt={4}><CircularProgress /></Box>
            ) : vendorUsers.length === 0 ? (
              <Typography color="text.secondary" align="center" mt={4}>No vendor users found.</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: `${theme.palette.primary.main}0A` }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', color: theme.palette.text.secondary }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', color: theme.palette.text.secondary }}>User Name</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', color: theme.palette.text.secondary }}>Contact No</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', color: theme.palette.text.secondary }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vendorUsers.map(vu => (
                      <TableRow
                        key={vu.id}
                        sx={{ '&:hover': { bgcolor: `${theme.palette.primary.main}06` }, cursor: 'default' }}
                      >
                        <TableCell sx={{ fontSize: '13px', fontWeight: 500, color: theme.palette.text.secondary }}>{vu.id}</TableCell>
                        <TableCell sx={{ fontSize: '13px', fontWeight: 600 }}>{vu.user || 'N/A'}</TableCell>
                        <TableCell sx={{ fontSize: '13px' }}>{vu.contactNo || '—'}</TableCell>
                        <TableCell>
                          <Box sx={{
                            display: 'inline-flex', px: 1, py: 0.2, borderRadius: 1,
                            fontSize: '0.72rem', fontWeight: 700,
                            bgcolor: vu.isActive !== false ? `${theme.palette.success.main}1A` : `${theme.palette.error.main}1A`,
                            color: vu.isActive !== false ? 'success.main' : 'error.main'
                          }}>
                            {vu.isActive !== false ? 'Active' : 'Inactive'}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

        </Card>
      </Box>
    </Box>
  );
}
