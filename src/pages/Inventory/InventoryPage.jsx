import {
  Box, Paper, Typography, Chip, Divider, Button, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { useTheme } from '@mui/material/styles';

const ENGINEER_REQUESTS = [
  { id: 'PR-1042', part: '16GB DDR4 SODIMM', tech: 'Alex Rivera', ticket: 'TK-4522', status: 'Pending Approval', priority: 'High', date: 'Oct 24, 2023' },
  { id: 'PR-1041', part: 'iPhone 13 OLED Display', tech: 'Jordan Smith', ticket: 'TK-4519', status: 'Ordered', priority: 'Critical', date: 'Oct 23, 2023' },
  { id: 'PR-1040', part: 'Dell XPS 15 Battery', tech: 'Kevin Zhang', ticket: 'TK-4520', status: 'In Transit', priority: 'Normal', date: 'Oct 22, 2023' },
];

const INVENTORY_ITEMS = [
  { sku: 'MEM-DDR4-16G', name: '16GB DDR4 Laptop RAM', stock: 12, minStock: 10, category: 'Memory' },
  { sku: 'PWR-65W-USB', name: 'Generic 65W AC Adapter', stock: 5, minStock: 15, category: 'Power' },
  { sku: 'STO-NVME-500G', name: '500GB NVMe SSD', stock: 8, minStock: 10, category: 'Storage' },
  { sku: 'KBD-TP-T14', name: 'ThinkPad Replacement Keys', stock: 45, minStock: 20, category: 'Input' },
];

export default function InventoryPage() {
  const theme = useTheme();

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending Approval': return '#B95000';
      case 'Ordered': return '#0052cc';
      case 'In Transit': return '#006c47';
      default: return theme.palette.text.secondary;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>Purchase & Inventory</Typography>
          <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>Mays Computer Repair - Procurement Dashboard</Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddOutlinedIcon />}>Order Parts</Button>
      </Box>

      {/* ── Stat Cards ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: 2, mb: 3 }}>
        {[
          { label: 'Pending Requests', value: '14', color: '#B95000', bg: '#B9500014' },
          { label: 'Orders in Transit', value: '08', color: '#0052cc', bg: '#0052cc14' },
          { label: 'Stock Alerts', value: '05', color: '#ba1a1a', bg: '#ba1a1a14' },
          { label: 'Returned Inventory', value: '05', color: '#006c47', bg: '#006c4714' },
        ].map((stat) => (
          <Paper key={stat.label} elevation={1} sx={{ p: 2.5, borderRadius: '3px', textAlign: 'center' }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>
              {stat.label}
            </Typography>
            <Typography sx={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>{stat.value}</Typography>
          </Paper>
        ))}
      </Box>
        {/* Engineer Part Requests */}
        <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptLongOutlinedIcon sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
            <Typography sx={{ fontSize: '15px', fontWeight: 600 }}>Engineer Part Requests</Typography>
          </Box>
          <Divider />
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: theme.palette.background.default }}>
                <TableRow>
                  <TableCell sx={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: theme.palette.text.secondary }}>Request ID</TableCell>
                  <TableCell sx={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: theme.palette.text.secondary }}>Part Requested</TableCell>
                  <TableCell sx={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: theme.palette.text.secondary }}>Engineer / Ticket</TableCell>
                  <TableCell sx={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: theme.palette.text.secondary }}>Status</TableCell>
                  <TableCell sx={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: theme.palette.text.secondary }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ENGINEER_REQUESTS.map((req) => (
                  <TableRow key={req.id} hover>
                    <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: theme.palette.primary.main }}>{req.id}</TableCell>
                    <TableCell sx={{ fontSize: '13px' }}>{req.part}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem', bgcolor: theme.palette.primary.main }}>{req.tech[0]}</Avatar>
                        <Box>
                          <Typography sx={{ fontSize: '13px', lineHeight: 1.2 }}>{req.tech}</Typography>
                          <Typography sx={{ fontSize: '11px', color: theme.palette.text.secondary }}>{req.ticket}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={req.status} 
                        size="small" 
                        sx={{ 
                          fontSize: '11px', fontWeight: 600, borderRadius: '2px', height: 20,
                          bgcolor: `${getStatusColor(req.status)}14`, 
                          color: getStatusColor(req.status) 
                        }} 
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" sx={{ py: 0.2, px: 1, fontSize: '11px' }}>Review</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Common Parts Inventory */}
        <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningAmberOutlinedIcon sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
              <Typography sx={{ fontSize: '15px', fontWeight: 600 }}>Common Parts Inventory</Typography>
            </Box>
            <Button size="small" sx={{ fontSize: '12px' }}>View Full Inventory</Button>
          </Box>
          <Divider />
          <Box sx={{ p: 2.5, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 2 }}>
            {INVENTORY_ITEMS.map((item) => {
              const isLow = item.stock < item.minStock;
              return (
                <Paper key={item.sku} variant="outlined" sx={{ p: 2, borderRadius: '3px', borderColor: isLow ? '#ba1a1a40' : theme.palette.divider }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontSize: '11px', color: theme.palette.text.secondary, fontWeight: 700, letterSpacing: '0.04em' }}>{item.category}</Typography>
                    {isLow ? (
                      <ErrorOutlineOutlinedIcon sx={{ fontSize: 16, color: '#ba1a1a' }} />
                    ) : (
                      <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 16, color: '#006c47' }} />
                    )}
                  </Box>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 1.5 }}>{item.name}</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '24px', fontWeight: 700, lineHeight: 1, color: isLow ? '#ba1a1a' : 'inherit' }}>{item.stock}</Typography>
                    <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>Min: {item.minStock}</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, (item.stock / item.minStock) * 100)} 
                    color={isLow ? "error" : "primary"}
                    sx={{ height: 4, borderRadius: 2 }} 
                  />
                </Paper>
              )
            })}
          </Box>
        </Paper>
    </Box>
  );
}
