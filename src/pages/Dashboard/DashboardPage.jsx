import { useState, useEffect, useCallback } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import List from '../../stereotype/AbstractList/List';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalLoading } from '../../contexts/GlobalLoadingContext';

const TICKET_COLUMNS = [
  { field: 'id', headerName: 'Ticket ID', width: 110, renderType: 'link' },
  { field: 'customer', headerName: 'Customer', width: 180 },
  { field: 'serialNo', headerName: 'Serial No', width: 150 },
  { field: 'branch', headerName: 'Branch', width: 150 },
  { field: 'department', headerName: 'Department', width: 150 },
  {
    field: 'status', headerName: 'Status', width: 130, renderType: 'chip',
    chipColorMap: {
      'OPEN': 'error', 'IN PROGRESS': 'warning', 'RESOLVED': 'success', 'CLOSED': 'success',
    },
  },
  { field: 'createdDate', headerName: 'Created Date', flex: 1 },
];

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
  const theme = useTheme();
  const navigate = useNavigate();
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

  const rawRole = user?.roles?.[0]?.authority || user?.role || 'ROLE_USER';
  const isNormalUser = rawRole === 'ROLE_USER';

  // 1. Fetch Stats (Admin only) - Automatically refreshes every 60 seconds
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/tickets/dashboard/stats');
      return res.data;
    },
    enabled: !isNormalUser,
    refetchInterval: 60000, // Poll every 60 seconds
  });

  // 2. Fetch Initial Tickets (Admin)
  const { data: adminTicketsInitial, isLoading: loadingAdminTickets } = useQuery({
    queryKey: ['dashboard-ticket-list', selectedDept],
    queryFn: async () => {
      const baseEndpoint = selectedDept === 'All' 
         ? '/tickets/dashboard' 
         : `/tickets/dashboard/department/${selectedDept}`;

      const [res0, res1] = await Promise.all([
        api.get(`${baseEndpoint}?offset=0&limit=10`),
        api.get(`${baseEndpoint}?offset=1&limit=10`)
      ]);
      
      const combined = [...(res0.data.content || []), ...(res1.data.content || [])];
      return Array.from(new Map(combined.map(item => [item.ticketId, item])).values());
    },
    enabled: !isNormalUser,
  });

  // 3. Fetch Tickets (Normal User)
  const { data: userTickets, isLoading: loadingUserTickets } = useQuery({
    queryKey: ['dashboard-ticket-list-user', user?.userId],
    queryFn: async () => {
      // Using user.userId from AuthContext instead of fetching /auth/me again
      const ticketsResponse = await api.get(`/tickets/user/${user.userId}`);
      return ticketsResponse.data || [];
    },
    enabled: isNormalUser && !!user?.userId,
  });

  // Sync React Query data to local state for rendering & custom pagination append logic
  useEffect(() => {
    if (isNormalUser && userTickets) {
      setTickets(userTickets);
    } else if (!isNormalUser && adminTicketsInitial) {
      setTickets(adminTicketsInitial);
      setFetchedPages(new Set([0, 1]));
    }
  }, [isNormalUser, userTickets, adminTicketsInitial]);

  const loading = isNormalUser ? loadingUserTickets : loadingAdminTickets;

  // Prefetch logic triggered by grid navigation
  const handlePaginationChange = useCallback(async (newModel) => {
    if (isNormalUser) return;
    
    const currentPage = newModel.page;
    const nextPage = currentPage + 1; // Always prefetch the next contiguous page
    
    if (!fetchedPages.has(nextPage)) {
      try {
        const baseEndpoint = selectedDept === 'All' 
             ? '/tickets/dashboard' 
             : `/tickets/dashboard/department/${selectedDept}`;

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
  }, [fetchedPages, isNormalUser, selectedDept]);

  // Fetch counts from API stats response
  const getDeptCount = (deptName) => {
    if (!stats) return 0;
    const dept = stats.departmentCounts.find(d => d.departmentName === deptName);
    return dept ? dept.ticketCount : 0;
  };

  const STATS = [
    {
      id: 'All', title: 'Total Tickets', value: stats ? stats.totalTickets : 0,
      icon: <ConfirmationNumberOutlinedIcon />,
      iconColor: '#0052cc', iconBg: '#0052cc14',
    },
    {
      id: 'Admin', title: 'Admin Tickets', value: getDeptCount('Admin'),
      icon: <AdminPanelSettingsOutlinedIcon />,
      iconColor: '#003d9b', iconBg: '#003d9b14',
    },
    {
      id: 'Engineer', title: 'Engineer Tickets', value: getDeptCount('Engineer'),
      icon: <EngineeringOutlinedIcon />,
      iconColor: '#006c47', iconBg: '#006c4714',
    },
    {
      id: 'MANAGER', title: 'Manager Tickets', value: getDeptCount('MANAGER'),
      icon: <ManageAccountsOutlinedIcon />,
      iconColor: '#B95000', iconBg: '#B9500014',
    },
    {
      id: 'Purchase Team', title: 'Purchase Tickets', value: getDeptCount('Purchase Team'),
      icon: <ShoppingCartOutlinedIcon />,
      iconColor: '#7b2600', iconBg: '#7b260014',
    },
  ];

  // Map raw API data to grid rows gracefully handling DTO fields
  const mappedRows = tickets.map(t => {
    const tId = t.ticketId || t.id;
    const fName = t.userFirstName || t.userMaster?.firstName || '';
    const lName = t.userLastName || t.userMaster?.lastName || '';
    const customerName = `${fName} ${lName}`.trim() || 'Unknown Customer';
    
    const serial = t.deviceSerialNo || t.device?.serialNo || 'N/A';
    const branch = t.branchName || t.ticketBranch?.branchName || 'Unknown Branch';
    const status = t.ticketStatusName || t.ticketStatus?.statusName || 'UNKNOWN';
    const dept = t.departmentName || t.employee?.department?.departmentName || 'Unassigned';
    
    const cDate = t.createdDate ? new Date(t.createdDate).toLocaleString() : 'N/A';

    return {
      id: `TK-${tId}`,
      customer: customerName,
      serialNo: serial,
      branch: branch,
      status: status,
      department: dept,
      createdDate: cDate,
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
    title: selectedDept === 'All' ? 'Tickets' : `${selectedDept} Tickets`,
    rows: mappedRows, // List handles its own internal search/filtering
    columns: TICKET_COLUMNS,
    loading: loading,
    actions: [
      { label: 'New Ticket', icon: <AddOutlinedIcon />, onClick: handleNewTicketClick },
    ],
    pagination: { pageSize: 10 },
    onPaginationChange: handlePaginationChange,
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
            onClick={handleNewTicketClick}
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
              {searchQuery ? 'No tickets match your search.' : 'You have not submitted any repair tickets.'}
            </Typography>
            {!searchQuery && (
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
          <StatCard 
            key={stat.title} 
            {...stat} 
            selected={selectedDept === stat.id}
            onClick={() => setSelectedDept(stat.id)}
          />
        ))}
      </Box>

      {/* ── Tickets DataGrid ── */}
      <List key={selectedDept} config={listConfig} />
    </Box>
  );
}
