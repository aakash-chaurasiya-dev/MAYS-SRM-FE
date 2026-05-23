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

/* ── Stat card data (matches "Admin Dashboard - Advanced Management" Stitch screen) ── */
const STATS = [
  {
    title: 'Total Tickets', value: '142',
    icon: <ConfirmationNumberOutlinedIcon />,
    iconColor: '#0052cc', iconBg: '#0052cc14',
  },
  {
    title: 'Admin Tickets', value: '34',
    icon: <AdminPanelSettingsOutlinedIcon />,
    iconColor: '#003d9b', iconBg: '#003d9b14',
  },
  {
    title: 'Engineer Tickets', value: '58',
    icon: <EngineeringOutlinedIcon />,
    iconColor: '#006c47', iconBg: '#006c4714',
  },
  {
    title: 'Manager Tickets', value: '22',
    icon: <ManageAccountsOutlinedIcon />,
    iconColor: '#B95000', iconBg: '#B9500014',
  },
  {
    title: 'Purchase Tickets', value: '28',
    icon: <ShoppingCartOutlinedIcon />,
    iconColor: '#7b2600', iconBg: '#7b260014',
  },
];

/* ── Ticket rows for the DataGrid ── */
const TICKET_ROWS = [
  { id: 'TK-1156', device: 'Surface Pro 7 - Cracked Screen', customer: 'Sarah Jenkins', status: 'Open', priority: 'Critical', assigned: 'Unassigned', days: 0, type: 'Admin' },
  { id: 'TK-1155', device: 'Custom PC - PSU Failure', customer: 'Mike Ross', status: 'In Triage', priority: 'High', assigned: 'Alex Rivera', days: 1, type: 'Engineer' },
  { id: 'TK-1154', device: 'MacBook Pro 16″ - Logic Board', customer: 'Johnathan Doe', status: 'In Repair', priority: 'High', assigned: 'Jordan Smith', days: 4, type: 'Engineer' },
  { id: 'TK-1153', device: 'Dell XPS 13 - Battery Replacement', customer: 'Anna White', status: 'Ready', priority: 'Normal', assigned: 'Kevin Zhang', days: 2, type: 'Admin' },
  { id: 'TK-1150', device: 'HP ZBook - Data Recovery', customer: 'Forensic Lab', status: 'In Repair', priority: 'Critical', assigned: 'Alex Rivera', days: 6, type: 'Manager' },
  { id: 'TK-1148', device: 'Razer Blade 15 - Battery', customer: 'Chris Park', status: 'Waiting Parts', priority: 'Low', assigned: 'Sarah Chen', days: 3, type: 'Purchase' },
  { id: 'TK-1146', device: 'ThinkPad T14s - Keyboard', customer: 'Emily Brown', status: 'Waiting Parts', priority: 'Normal', assigned: 'Jordan Smith', days: 5, type: 'Purchase' },
  { id: 'TK-1144', device: 'iMac 27″ - GPU Reballing', customer: 'Design Studio', status: 'Outsourced', priority: 'High', assigned: 'External', days: 8, type: 'Manager' },
  { id: 'TK-1142', device: 'Dell Precision 5550 - Motherboard', customer: 'Corp Account', status: 'In Repair', priority: 'Normal', assigned: 'Sarah Chen', days: 3, type: 'Engineer' },
  { id: 'TK-1140', device: 'HP Pavilion - OS Reinstall', customer: 'Walk-in Client', status: 'Completed', priority: 'Low', assigned: 'Kevin Zhang', days: 1, type: 'Admin' },
];

const TICKET_COLUMNS = [
  { field: 'id', headerName: 'Ticket ID', width: 100, renderType: 'link' },
  { field: 'device', headerName: 'Device / Issue', flex: 1.5 },
  { field: 'customer', headerName: 'Customer', flex: 1 },
  {
    field: 'status', headerName: 'Status', width: 130, renderType: 'chip',
    chipColorMap: {
      'Open': 'error', 'In Triage': 'warning', 'In Repair': 'primary',
      'Ready': 'success', 'Waiting Parts': 'warning', 'Outsourced': 'secondary',
      'Completed': 'success',
    },
  },
  {
    field: 'priority', headerName: 'Priority', width: 100, renderType: 'chip',
    chipColorMap: { Critical: 'error', High: 'warning', Normal: 'primary', Low: 'success' },
  },
  { field: 'assigned', headerName: 'Assigned To', flex: 1 },
  { field: 'type', headerName: 'Type', width: 100 },
  { field: 'days', headerName: 'Days', width: 70, type: 'number' },
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

  const listConfig = {
    title: 'Tickets',
    rows: TICKET_ROWS,
    columns: TICKET_COLUMNS,
    actions: [
      { label: 'New Ticket', icon: <AddOutlinedIcon />, onClick: () => navigate('/tickets/new') },
    ],
    pagination: { pageSize: 10 },
    searchPlaceholder: 'Search tickets…',
    getRowId: (row) => row.id,
    onRowClick: (params) => navigate(`/tickets/${params.id}`),
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
