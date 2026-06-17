import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Chip, Button, Divider, TextField,
} from '@mui/material';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import List from '../../stereotype/AbstractList/List';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const TICKET_COLUMNS = [
  { field: 'id', headerName: 'Ticket ID', width: 110, renderType: 'link' },
  { field: 'customer', headerName: 'Customer', width: 170 },
  { field: 'email', headerName: 'Email', width: 220 },
  { field: 'device', headerName: 'Device', width: 170 },
  { field: 'description', headerName: 'Issue Description', flex: 1.8 },
  { field: 'serialNo', headerName: 'Serial No', width: 140 },
  { field: 'branch', headerName: 'Branch', width: 140 },
  {
    field: 'status', headerName: 'Status', width: 130, renderType: 'chip',
    chipColorMap: {
      'OPEN': 'error', 'IN PROGRESS': 'warning', 'RESOLVED': 'success', 'CLOSED': 'success',
    },
  },
  {
    field: 'warranty', headerName: 'Warranty', width: 130, renderType: 'chip',
    chipColorMap: { 'In Warranty': 'success', 'Out of Warranty': 'error' },
  },
  { field: 'assigned', headerName: 'Assigned To', width: 180 },
  { field: 'department', headerName: 'Department', width: 150 },
  { field: 'type', headerName: 'Type', width: 130 },
];

/* ── Stat Card Component ── */
function StatCard({ title, value, icon, iconColor, iconBg }) {
  const theme = useTheme();
  return (
    <Paper
      elevation={1}
      sx={{
        p: 2.5, flex: 1, minWidth: 160, borderRadius: '3px',
        display: 'flex', alignItems: 'center', gap: 2,
      }}
    >
      <Box sx={{
        width: 44, height: 44, borderRadius: '6px', bgcolor: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: iconColor, flexShrink: 0,
      }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{
          fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
          textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.3,
        }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: '26px', fontWeight: 700, lineHeight: 1.1 }}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}

/* ── Dashboard Page ── */
export default function DashboardPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [tickets, setTickets] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEnquiries, setLoadingEnquiries] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const rawRole = user?.roles?.[0]?.authority || user?.role || 'ROLE_USER';
  const isNormalUser = rawRole === 'ROLE_USER';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (isNormalUser) {
          const meResponse = await api.get('/auth/me');
          const myId = meResponse.data.userId;
          const [ticketsResponse, enquiriesResponse] = await Promise.all([
            api.get(`/tickets/user/${myId}`),
            api.get(`/enquiries/user/${myId}`)
          ]);
          setTickets(ticketsResponse.data || []);
          setEnquiries(enquiriesResponse.data || []);
        } else {
          const ticketsResponse = await api.get('/tickets');
          setTickets(ticketsResponse.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
        setLoadingEnquiries(false);
      }
    };
    fetchDashboardData();
  }, [isNormalUser]);

  // Compute dynamic stats
  const getDepartmentName = (ticket) => ticket.departmentName;

  const adminCount = tickets.filter(t => getDepartmentName(t) === 'Admin').length;
  const engineerCount = tickets.filter(t => getDepartmentName(t) === 'Engineer').length;
  const managerCount = tickets.filter(t => getDepartmentName(t) === 'MANAGER').length;
  const purchaseCount = tickets.filter(t => getDepartmentName(t) === 'Purchase Team').length;

  const STATS = [
    {
      title: 'Total Tickets', value: tickets.length,
      icon: <ConfirmationNumberOutlinedIcon />,
      iconColor: '#0052cc', iconBg: '#0052cc14',
    },
    {
      title: 'Admin Tickets', value: adminCount,
      icon: <AdminPanelSettingsOutlinedIcon />,
      iconColor: '#003d9b', iconBg: '#003d9b14',
    },
    {
      title: 'Engineer Tickets', value: engineerCount,
      icon: <EngineeringOutlinedIcon />,
      iconColor: '#006c47', iconBg: '#006c4714',
    },
    {
      title: 'Manager Tickets', value: managerCount,
      icon: <ManageAccountsOutlinedIcon />,
      iconColor: '#B95000', iconBg: '#B9500014',
    },
    {
      title: 'Purchase Tickets', value: purchaseCount,
      icon: <ShoppingCartOutlinedIcon />,
      iconColor: '#7b2600', iconBg: '#7b260014',
    },
  ];

  // Map raw API data to rows
  const mappedRows = tickets.map(t => {
    const brand = t.device?.model?.brand?.brandName || 'Unknown Brand';
    const model = t.device?.model?.modelName || t.deviceModelName || 'Unknown Model';
    const customerName = `${t.userMaster?.firstName || t.userFirstName || ''} ${t.userMaster?.lastName || t.userLastName || ''}`.trim() || 'Unknown Customer';

    return {
      id: `TK-${t.ticketId}`,
      customer: customerName,
      email: t.emailId || t.userMaster?.emailId || 'N/A',
      device: `${brand} ${model}`,
      description: t.ticketDescription || 'No description provided',
      serialNo: t.device?.serialNo || t.deviceSerialNo || 'N/A',
      branch: t.ticketBranch?.branchName || t.branchName || 'Unknown Branch',
      status: t.ticketStatus?.statusName || t.ticketStatusName || 'UNKNOWN',
      warranty: t.warrantyType || 'Unknown',
      assigned: t.employee?.employeeName || t.employeeName || 'Unassigned',
      department: t.employee?.department?.departmentName || t.departmentName || 'Unassigned',
      type: t.ticketType?.ticketTypeName || t.ticketTypeName || 'Unknown',
      priority: t.priority || 'Normal',
      rawId: t.ticketId,
    };
  });

  const filteredRows = mappedRows.filter(row => {
    const query = searchQuery.toLowerCase();
    return (
      row.id.toLowerCase().includes(query) ||
      row.device.toLowerCase().includes(query) ||
      row.description.toLowerCase().includes(query) ||
      row.status.toLowerCase().includes(query)
    );
  });

  const listConfig = {
    title: 'Tickets',
    rows: mappedRows,
    columns: TICKET_COLUMNS,
    loading: loading,
    actions: [
      { label: 'New Ticket', icon: <AddOutlinedIcon />, onClick: () => navigate('/tickets/new') },
    ],
    pagination: { pageSize: 10 },
    searchPlaceholder: 'Search tickets…',
    getRowId: (row) => row.id,
    onRowClick: (params) => navigate(`/tickets/${params.row.rawId}`),
    height: 480,
  };

  /* ── Customer-Specific Portal (Mobile Friendly) ── */
  if (isNormalUser) {
    return (
      <Box>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
              My Support Portal
            </Typography>
            <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
              Track the progress of your repair requests
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={() => navigate('/tickets/new')}
            sx={{ fontWeight: 600, textTransform: 'none', py: 0.9 }}
          >
            New Support Request
          </Button>
        </Box>

        {/* Search Input */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search tickets by ID, device, or status…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ bgcolor: theme.palette.background.paper }}
          />
        </Box>

        {/* Content list */}
        {loading ? (
          <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
            Loading your tickets…
          </Typography>
        ) : filteredRows.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', border: `1px dashed ${theme.palette.divider}`, bgcolor: 'transparent' }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.text.secondary }}>
              {searchQuery ? 'No tickets match your search.' : 'You have not submitted any repair tickets.'}
            </Typography>
            {!searchQuery && (
              <Button
                variant="outlined"
                startIcon={<AddOutlinedIcon />}
                onClick={() => navigate('/tickets/new')}
                sx={{ mt: 2, textTransform: 'none' }}
              >
                Create Support Ticket
              </Button>
            )}
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr', md: 'repeat(2, 1fr)' }, gap: 2.5 }}>
            {filteredRows.map((ticket) => (
              <Paper
                key={ticket.id}
                elevation={1}
                onClick={() => navigate(`/tickets/${ticket.rawId}`)}
                sx={{
                  p: 2.5,
                  borderRadius: '4px',
                  borderLeft: `4px solid ${
                    ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                      ? theme.palette.success.main
                      : ticket.status === 'IN PROGRESS'
                      ? theme.palette.warning.main
                      : theme.palette.error.main
                  }`,
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '14px', color: theme.palette.primary.main }}>
                    {ticket.id}
                  </Typography>
                  <Chip
                    label={ticket.status}
                    size="small"
                    color={
                      ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                        ? 'success'
                        : ticket.status === 'IN PROGRESS'
                        ? 'warning'
                        : 'error'
                    }
                    sx={{ fontWeight: 600, borderRadius: '3px', height: 20, fontSize: '11px' }}
                  />
                </Box>

                <Typography sx={{ fontWeight: 600, fontSize: '16px', mb: 0.5 }}>
                  {ticket.device}
                </Typography>

                <Typography
                  sx={{
                    fontSize: '13px',
                    color: theme.palette.text.secondary,
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {ticket.description}
                </Typography>

                <Divider sx={{ mb: 1.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '11px', color: theme.palette.text.secondary }}>
                    Priority:{' '}
                    <Box
                      component="span"
                      sx={{
                        fontWeight: 600,
                        color:
                          ticket.priority === 'Critical'
                            ? 'error.main'
                            : ticket.priority === 'High'
                            ? 'warning.main'
                            : 'text.primary',
                      }}
                    >
                      {ticket.priority}
                    </Box>
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: theme.palette.text.secondary }}>
                    {ticket.warranty}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        )}

        <Divider sx={{ my: 4 }} />

        {/* ── Enquiries Section ── */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
              My Enquiries
            </Typography>
            <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
              Pre-service diagnostic requests and model specifications queries
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => navigate('/enquiries')}
            sx={{ fontWeight: 600, textTransform: 'none', py: 0.8 }}
          >
            Manage Enquiries
          </Button>
        </Box>

        {/* Enquiries Grid */}
        {loadingEnquiries ? (
          <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
            Loading your enquiries…
          </Typography>
        ) : enquiries.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', border: `1px dashed ${theme.palette.divider}`, bgcolor: 'transparent' }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.text.secondary }}>
              You have not submitted any technical support enquiries.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate('/enquiries')}
              sx={{ mt: 2, textTransform: 'none' }}
            >
              Submit New Enquiry
            </Button>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr', md: 'repeat(2, 1fr)' }, gap: 2.5 }}>
            {enquiries.slice(0, 4).map((enq) => (
              <Paper
                key={enq.enquiryId}
                elevation={1}
                onClick={() => navigate('/enquiries')}
                sx={{
                  p: 2.5,
                  borderRadius: '4px',
                  borderLeft: `4px solid ${
                    enq.statusName && (enq.statusName.toUpperCase().includes('REPLIED') || enq.statusName.toUpperCase().includes('RESOLVED') || enq.statusName.toUpperCase().includes('CLOSED'))
                      ? theme.palette.success.main
                      : theme.palette.warning.main
                  }`,
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '13px', color: theme.palette.primary.main }}>
                    ENQ-{enq.enquiryId}
                  </Typography>
                  <Chip
                    label={enq.statusName || 'PENDING'}
                    size="small"
                    color={
                      enq.statusName && (enq.statusName.toUpperCase().includes('REPLIED') || enq.statusName.toUpperCase().includes('RESOLVED') || enq.statusName.toUpperCase().includes('CLOSED'))
                        ? 'success'
                        : 'warning'
                    }
                    sx={{ fontWeight: 600, borderRadius: '3px', height: 20, fontSize: '11px' }}
                  />
                </Box>

                <Typography sx={{ fontWeight: 600, fontSize: '16px', mb: 0.5 }}>
                  {enq.brandName || 'General Brand'} {enq.serialNo ? `(S/N: ${enq.serialNo})` : ''}
                </Typography>

                <Typography sx={{ fontWeight: 600, fontSize: '13.5px', mb: 1, color: 'text.secondary' }}>
                  {enq.enquiryFor}
                </Typography>

                <Typography
                  sx={{
                    fontSize: '13px',
                    color: theme.palette.text.secondary,
                    mb: enq.remark ? 1.5 : 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {enq.queryText}
                </Typography>

                {enq.remark && (
                  <Box sx={{ p: 1.5, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f8f9fa', borderRadius: '3px', border: `1px solid ${theme.palette.divider}`, mt: 1.5 }}>
                    <Typography sx={{ fontSize: '10px', fontWeight: 700, color: 'success.main', mb: 0.3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Support Advice
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: theme.palette.text.primary,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {enq.remark}
                    </Typography>
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  /* ── Employee-Specific Command Center ── */
  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
          Admin Command Center
        </Typography>
        <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
          Real-time overview of workshop operations
        </Typography>
      </Box>

      {/* ── Stat Cards Row ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(5, 1fr)',
          },
          gap: 2, mb: 3,
        }}
      >
        {STATS.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </Box>

      {/* ── Tickets DataGrid ── */}
      <List config={listConfig} />
    </Box>
  );
}
