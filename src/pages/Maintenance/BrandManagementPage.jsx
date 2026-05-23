import { useState } from 'react';
import { Box, Paper, Typography, Chip, Button, Divider } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import List from '../../stereotype/AbstractList/List';
import AddBrandModal from './AddBrandModal';

const BRAND_STATS = [
  { label: 'Total Brands', value: '42', color: '#0052cc' },
  { label: 'Active', value: '38', color: '#006c47' },
  { label: 'Inactive', value: '4', color: '#B95000' },
  { label: 'System Critical', value: '2', color: '#ba1a1a' },
  { label: 'Avg Capacity', value: '84%', color: '#0052cc' },
];

const BRAND_ROWS = [
  { id: 1, name: 'Apple', code: 'APL', category: 'Consumer Electronics', status: 'Active', devices: 142, capacity: 92 },
  { id: 2, name: 'Dell', code: 'DEL', category: 'Enterprise', status: 'Active', devices: 98, capacity: 88 },
  { id: 3, name: 'Lenovo', code: 'LEN', category: 'Enterprise', status: 'Active', devices: 76, capacity: 81 },
  { id: 4, name: 'HP', code: 'HPQ', category: 'Enterprise', status: 'Active', devices: 65, capacity: 79 },
  { id: 5, name: 'Microsoft', code: 'MSF', category: 'Consumer Electronics', status: 'Active', devices: 34, capacity: 85 },
  { id: 6, name: 'Razer', code: 'RZR', category: 'Gaming', status: 'Active', devices: 23, capacity: 72 },
  { id: 7, name: 'Samsung', code: 'SAM', category: 'Consumer Electronics', status: 'Active', devices: 45, capacity: 90 },
  { id: 8, name: 'ASUS', code: 'ASU', category: 'Consumer Electronics', status: 'Inactive', devices: 12, capacity: 45 },
];

const BRAND_COLUMNS = [
  { field: 'name', headerName: 'Brand Name', flex: 1.2, renderType: 'link' },
  { field: 'code', headerName: 'Code', width: 90 },
  { field: 'category', headerName: 'Category', flex: 1 },
  {
    field: 'status', headerName: 'Status', width: 110, renderType: 'chip',
    chipColorMap: { Active: 'success', Inactive: 'warning' },
  },
  { field: 'devices', headerName: 'Devices', width: 90, type: 'number' },
  { field: 'capacity', headerName: 'Capacity', width: 140, renderType: 'progress' },
];

export default function BrandManagementPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const listConfig = {
    title: 'Brand Management',
    subtitle: 'Showing 1-' + BRAND_ROWS.length + ' of 42 brands',
    rows: BRAND_ROWS,
    columns: BRAND_COLUMNS,
    actions: [
      { label: 'Add Brand', icon: <AddOutlinedIcon />, onClick: () => setModalOpen(true) },
    ],
    pagination: { pageSize: 10 },
    searchPlaceholder: 'Search brands…',
    height: 440,
  };

  return (
    <Box>
      {/* Breadcrumb / Back */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate('/maintenance')}
          sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
          Maintenance
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
          Brand Management
        </Typography>
        <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
          Manage and configure authorized service brands
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)', lg: 'repeat(5,1fr)' }, gap: 2, mb: 3 }}>
        {BRAND_STATS.map((stat) => (
          <Paper key={stat.label} elevation={1} sx={{ p: 2, borderRadius: '3px', textAlign: 'center' }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>
              {stat.label}
            </Typography>
            <Typography sx={{ fontSize: '24px', fontWeight: 700, color: stat.color }}>{stat.value}</Typography>
          </Paper>
        ))}
      </Box>

      {/* DataGrid */}
      <List config={listConfig} />

      {/* Add Brand Modal */}
      <AddBrandModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Box>
  );
}
