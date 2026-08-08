import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Chip, Button, Divider, TextField,
} from '@mui/material';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { useTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import List from '../../stereotype/AbstractList/List';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { getUserRole, hasAnyRole } from '../../access/featureAccess';
import { useGlobalLoading } from '../../contexts/GlobalLoadingContext';
import { useNavigate } from 'react-router-dom';

const TICKET_COLUMNS = [
  { field: 'id', headerName: 'Ticket ID', width: 110, renderType: 'link' },
  { field: 'customer', headerName: 'Customer', width: 180 },
  { field: 'vendor', headerName: 'Vendor', width: 150 },
  { field: 'serialNo', headerName: 'Serial No', width: 150 },
  { field: 'branch', headerName: 'Branch', width: 150 },
  { field: 'department', headerName: 'Department', width: 150 },
  { field: 'employee', headerName: 'Employee', width: 150 },
  {
    field: 'status', headerName: 'Status', width: 130, renderType: 'chip',
    chipColorMap: {
      'OPEN': 'error', 'IN PROGRESS': 'warning', 'RESOLVED': 'success', 'CLOSED': 'success',
    },
  },
  { field: 'createdDate', headerName: 'Created Date', width: 170 },
  { field: 'targetDate', headerName: 'Target Date', flex: 1 },
];

const DEPT_CARD_STYLES = [
  { icon: <AdminPanelSettingsOutlinedIcon />, iconColor: '#003d9b', iconBg: '#003d9b14' },
  { icon: <EngineeringOutlinedIcon />, iconColor: '#006c47', iconBg: '#006c4714' },
  { icon: <ManageAccountsOutlinedIcon />, iconColor: '#B95000', iconBg: '#B9500014' },
  { icon: <ShoppingCartOutlinedIcon />, iconColor: '#7b2600', iconBg: '#7b260014' },
  { icon: <BusinessOutlinedIcon />, iconColor: '#5b2d8e', iconBg: '#5b2d8e14' },
];

const KNOWN_DEPT_STYLES = {
  Admin: DEPT_CARD_STYLES[0],
  Engineer: DEPT_CARD_STYLES[1],
  Management: DEPT_CARD_STYLES[2],
  'Purchase Team': DEPT_CARD_STYLES[3],
  Unassigned: {
    icon: <HelpOutlineOutlinedIcon />,
    iconColor: '#5f6368',
    iconBg: '#5f636814',
  },
};

function getDeptCardStyle(departmentName, index) {
  return KNOWN_DEPT_STYLES[departmentName] || DEPT_CARD_STYLES[index % DEPT_CARD_STYLES.length];
}

function buildDashboardEndpoint(selectedDept) {
  if (selectedDept === 'All') return '/tickets/dashboard';
  return `/tickets/dashboard/department/${encodeURIComponent(selectedDept)}`;
}

/* ── Stat Card Component ── */
function StatCard({ title, value, icon, iconColor, iconBg, selected, onClick }) {
  const theme = useTheme();
  return (
    <Paper
      elevation={selected ? 3 : 1}
      onClick={onClick}
      sx={{
        p: 2.5, flex: 1, minWidth: 160, borderRadius: '3px',
        display: 'flex', alignItems: 'center', gap: 2,
        cursor: onClick ? 'pointer' : 'default',
        border: selected ? `2px solid ${iconColor}` : '2px solid transparent',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: onClick ? 'translateY(-2px)' : 'none',
          boxShadow: onClick ? '0 4px 12px rgba(0,0,0,0.08)' : 'none'
        }
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
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const { showLoading, hideLoading } = useGlobalLoading();

  const handleNewTicketClick = () => {
    showLoading('Loading New Ticket...');
    setTimeout(() => {
      hideLoading();
      navigate('/tickets/new');
    }, 800);
  };

  const [tickets, setTickets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchedPages, setFetchedPages] = useState(new Set());
  const [selectedDept, setSelectedDept] = useState('All');

  const rawRole = getUserRole(user);
  const isNormalUser = rawRole === 'ROLE_USER';
  const isVendor = rawRole === 'ROLE_VENDOR';
  const isPortalUser = isNormalUser || isVendor;
  const isEngineer = rawRole === 'ROLE_ENGINEER';
  const isPurchase = rawRole === 'ROLE_PURCHASE';
  const isEmployeeWithSelfTickets = isEngineer || isPurchase;
  const isExecutiveView = hasAnyRole(user, ['ROLE_EXECUTIVE', 'ROLE_MANAGER', 'ROLE_ADMIN']);

  // Pending SLA hold requests (Executive/Manager dashboard)
  const { data: pendingHoldRequests = [] } = useQuery({
    queryKey: ['sla-hold-pending'],
    queryFn: async () => {
      const res = await api.get('/sla-hold-requests/pending');
      return res.data || [];
    },
    enabled: isExecutiveView && !isPortalUser,
    refetchInterval: 60000,
  });

  // 1. Fetch Stats (Admin/Manager only) - Automatically refreshes every 60 seconds
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/tickets/dashboard/stats');
      return res.data;
    },
    enabled: !isPortalUser && !isEmployeeWithSelfTickets,
    refetchInterval: 60000,
  });

  // 2. Fetch Initial Tickets (Admin/Manager)
  const { data: adminTicketsInitial, isLoading: loadingAdminTickets } = useQuery({
    queryKey: ['dashboard-ticket-list', selectedDept],
    queryFn: async () => {
      const baseEndpoint = buildDashboardEndpoint(selectedDept);

      const [res0, res1] = await Promise.all([
        api.get(`${baseEndpoint}?offset=0&limit=10`),
        api.get(`${baseEndpoint}?offset=1&limit=10`)
      ]);

      const combined = [...(res0.data.content || []), ...(res1.data.content || [])];
      return Array.from(new Map(combined.map(item => [item.ticketId, item])).values());
    },
    enabled: !isPortalUser && !isEmployeeWithSelfTickets,
  });

  // 3. Fetch Tickets (Normal User)
  const { data: userTickets, isLoading: loadingUserTickets } = useQuery({
    queryKey: ['dashboard-ticket-list-user', user?.userId],
    queryFn: async () => {
      // Using user.userId from AuthContext instead of fetching /auth/me again
      const ticketsResponse = await api.get(`/tickets/user/dashboard/${user.userId}`);
      return ticketsResponse.data || [];
    },
    enabled: isNormalUser && !!user?.userId,
  });

  // 4. Fetch Tickets (Engineer & Purchase)
  const { data: employeeTickets, isLoading: loadingEmployeeTickets } = useQuery({
    queryKey: ['dashboard-ticket-list-employee', user?.userId],
    queryFn: async () => {
      const ticketsResponse = await api.get(`/tickets/employee/${user.userId}`);
      return ticketsResponse.data || [];
    },
    enabled: isEmployeeWithSelfTickets && !!user?.userId,
  });

  // 5. Fetch Tickets (Vendor)
  const { data: vendorTickets, isLoading: loadingVendorTickets } = useQuery({
    queryKey: ['dashboard-ticket-list-vendor', user?.userId],
    queryFn: async () => {
      const ticketsResponse = await api.get(`/tickets/vendor/${user.userId}`);
      return ticketsResponse.data || [];
    },
    enabled: isVendor && !!user?.userId,
  });

  // Sync React Query data to local state only for Admin/Manager (for pagination append logic)
  useEffect(() => {
    if (!isPortalUser && !isEmployeeWithSelfTickets && adminTicketsInitial) {
      setTickets(adminTicketsInitial);
      setFetchedPages(new Set([0, 1]));
    }
  }, [isPortalUser, isEmployeeWithSelfTickets, adminTicketsInitial]);

  const loading = isNormalUser
    ? loadingUserTickets
    : isVendor
      ? loadingVendorTickets
      : isEmployeeWithSelfTickets
        ? loadingEmployeeTickets
        : loadingAdminTickets;

  const displayTickets = isNormalUser
    ? (userTickets || [])
    : isVendor
      ? (vendorTickets || [])
      : isEmployeeWithSelfTickets
        ? (employeeTickets || [])
        : tickets;

  // Prefetch logic triggered by grid navigation
  const handlePaginationChange = useCallback(async (newModel) => {
    if (isPortalUser || isEmployeeWithSelfTickets) return;

    const currentPage = newModel.page;
    const nextPage = currentPage + 1; // Always prefetch the next contiguous page

    if (!fetchedPages.has(nextPage)) {
      try {
        const baseEndpoint = buildDashboardEndpoint(selectedDept);

        const res = await api.get(`${baseEndpoint}?offset=${nextPage}&limit=${newModel.pageSize}`);
        const newTickets = res.data.content || [];

        if (newTickets.length > 0) {
          setTickets(prev => {
            const combined = [...prev, ...newTickets];
            return Array.from(new Map(combined.map(item => [item.ticketId, item])).values());
          });
        }

        setFetchedPages(prev => {
          const nextSet = new Set(prev);
          nextSet.add(nextPage);
          return nextSet;
        });
      } catch (err) {
        console.error('Failed to prefetch page', nextPage, err);
      }
    }
  }, [fetchedPages, isPortalUser, isEmployeeWithSelfTickets, selectedDept]);

  const STATS = [
    {
      id: 'All',
      title: 'Total Tickets',
      value: stats ? stats.totalTickets : 0,
      icon: <ConfirmationNumberOutlinedIcon />,
      iconColor: '#0052cc',
      iconBg: '#0052cc14',
    },
    ...((stats?.departmentCounts) || []).map((dept, index) => {
      const name = dept.departmentName || 'Unassigned';
      const style = getDeptCardStyle(name, index);
      return {
        id: name,
        title: `${name} Tickets`,
        value: dept.ticketCount ?? 0,
        ...style,
      };
    }),
  ];

  // Map raw API data to grid rows gracefully handling DTO fields
  const mappedRows = displayTickets.map(t => {
    const tId = t.ticketId || t.id;
    const fName = t.userFirstName || t.userMaster?.firstName || '';
    const lName = t.userLastName || t.userMaster?.lastName || '';
    const customerName = `${fName} ${lName}`.trim() || 'Unknown Customer';

    const serial = t.deviceSerialNo || t.device?.serialNo || 'N/A';
    const branch = t.branchName || t.ticketBranch?.branchName || 'Unknown Branch';
    const status = t.ticketStatusName || t.ticketStatus?.statusName || 'UNKNOWN';
    const dept = t.departmentName || t.employee?.department?.departmentName || 'Unassigned';

    const cDate = t.createdDate ? new Date(t.createdDate).toLocaleString() : 'N/A';
    const targetDate = t.targetDate ? new Date(t.targetDate).toLocaleString() : 'N/A';
    const employee = t.employeeName || 'Unassigned';
    const vendor = t.vendorName || 'Direct';

    return {
      id: `TK-${tId}`,
      customer: customerName,
      vendor,
      serialNo: serial,
      branch: branch,
      status: status,
      department: dept,
      employee: employee,
      createdDate: cDate,
      targetDate: targetDate,
      rawId: tId,
    };
  });

  const filteredRows = mappedRows.filter(row => {
    const query = searchQuery.toLowerCase();
    return (
      row.id.toLowerCase().includes(query) ||
      row.serialNo.toLowerCase().includes(query) ||
      row.status.toLowerCase().includes(query) ||
      row.customer.toLowerCase().includes(query)
    );
  });

  const listConfig = {
    title: isEmployeeWithSelfTickets ? 'My Tickets' : (selectedDept === 'All' ? 'Tickets' : `${selectedDept} Tickets`),
    rows: mappedRows, // List handles its own internal search/filtering
    columns: TICKET_COLUMNS,
    loading: loading,
    actions: isEmployeeWithSelfTickets ? [] : [
      { label: 'New Ticket', icon: <AddOutlinedIcon />, onClick: handleNewTicketClick },
    ],
    pagination: { pageSize: 10 },
    onPaginationChange: handlePaginationChange,
    searchPlaceholder: 'Search tickets…',
    getRowId: (row) => row.id,
    onRowClick: (params) => navigate(`/tickets/${params.row.rawId}`),
    height: 480,
  };

  /* ── Customer / Vendor Portal (Mobile Friendly) ── */
  if (isPortalUser) {
    return (
      <Box>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
              {isVendor ? 'Vendor Ticket Portal' : 'My Support Portal'}
            </Typography>
            <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
              {isVendor
                ? 'Create and track tickets submitted to the service center'
                : 'Track the progress of your repair requests'}
            </Typography>
          </Box>
          {isVendor && (
            <Button
              variant="contained"
              startIcon={<AddOutlinedIcon />}
              onClick={handleNewTicketClick}
              sx={{ fontWeight: 600, textTransform: 'none', py: 0.9 }}
            >
              New Ticket
            </Button>
          )}
        </Box>

        {/* Search Input */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search tickets by ID, serial no, or status…"
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
              {searchQuery
                ? 'No tickets match your search.'
                : isVendor
                  ? 'You have not created any tickets yet.'
                  : 'You have not submitted any repair tickets.'}
            </Typography>
            {!searchQuery && isVendor && (
              <Button
                variant="outlined"
                startIcon={<AddOutlinedIcon />}
                onClick={handleNewTicketClick}
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
                  borderLeft: `4px solid ${ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
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
                  {ticket.serialNo}
                </Typography>
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
      {/* ── Stat Cards Row ── */}
      {!isEmployeeWithSelfTickets && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(auto-fill, minmax(180px, 1fr))',
            },
            gap: 2, mb: 3,
          }}
        >
          {STATS.map((stat) => (
            <StatCard
              key={stat.id}
              {...stat}
              selected={selectedDept === stat.id}
              onClick={() => setSelectedDept(stat.id)}
            />
          ))}
        </Box>
      )}

      {isExecutiveView && pendingHoldRequests.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, border: `1px solid ${theme.palette.warning.light}` }}>
          <Typography sx={{ fontSize: '15px', fontWeight: 600, mb: 1.5 }}>
            Tickets Awaiting SLA Hold Approval ({pendingHoldRequests.length})
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {pendingHoldRequests.map((req) => (
              <Box
                key={req.id}
                onClick={() => navigate(`/tickets/${req.ticketId}`)}
                sx={{
                  p: 1.5, borderRadius: 1, border: `1px solid ${theme.palette.divider}`,
                  cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                  Ticket #{req.ticketId} · {req.assigneeName || req.requestedByName}
                </Typography>
                <Typography sx={{ fontSize: '13px', color: 'text.secondary' }}>
                  {req.reason || 'No reason provided'}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* ── Tickets DataGrid ── */}
      <List key={selectedDept} config={listConfig} />
    </Box>
  );
}
