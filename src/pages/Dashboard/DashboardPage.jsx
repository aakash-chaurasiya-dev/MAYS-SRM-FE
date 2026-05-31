import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Chip, Button, Divider,
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
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tickets')
      .then(res => res.json())
      .then(data => {
        setTickets(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch tickets', err);
        setLoading(false);
      });
  }, []);

  // Compute dynamic stats
  const adminCount = tickets.filter(t => t.employee?.department?.departmentName === 'Admin').length;
  const engineerCount = tickets.filter(t => t.employee?.department?.departmentName === 'Engineer').length;
  const managerCount = tickets.filter(t => t.employee?.department?.departmentName === 'Management').length;
  const purchaseCount = tickets.filter(t => t.employee?.department?.departmentName === 'Purchase Team').length;

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
    const model = t.device?.model?.modelName || 'Unknown Model';
    const customerName = `${t.userMaster?.firstName || ''} ${t.userMaster?.lastName || ''}`.trim() || 'Unknown Customer';

    return {
      id: `TK-${t.ticketId}`,
      customer: customerName,
      email: t.emailId || t.userMaster?.emailId || 'N/A',
      device: `${brand} ${model}`,
      description: t.ticketDescription || 'No description provided',
      serialNo: t.device?.serialNo || 'N/A',
      branch: t.ticketBranch?.branchName || 'Unknown Branch',
      status: t.ticketStatus?.statusName || 'UNKNOWN',
      warranty: t.warrantyType || 'Unknown',
      assigned: t.employee?.employeeName || 'Unassigned',
      department: t.employee?.department?.departmentName || 'Unassigned',
      type: t.ticketType?.ticketTypeName || 'Unknown',
      rawId: t.ticketId,
    };
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
