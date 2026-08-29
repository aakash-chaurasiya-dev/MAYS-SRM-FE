import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Typography, Paper, Divider, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useQuery } from '@tanstack/react-query';
import { List } from '../../stereotype/AbstractList';
import api from '../../services/api';

const formatMoney = (value) => {
  if (value == null) return '-';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
};

const boolLabel = (v) => (v ? 'Yes' : 'No');

export default function PartsOrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ['parts-order', orderId],
    queryFn: async () => {
      const response = await api.get(`/parts-orders/${orderId}`);
      return response.data?.data || response.data || null;
    },
    enabled: !!orderId,
  });

  const lines = useMemo(
    () =>
      (order?.lines || []).map((row, i) => ({
        ...row,
        id: row.individualPartId || `fallback-id-${i}`,
      })),
    [order]
  );

  const config = useMemo(() => ({
    title: 'Order Lines',
    subtitle: `${lines.length} parts`,
    rows: lines,
    columns: [
      { field: 'id', headerName: 'Part ID', width: 90 },
      { field: 'partSrNo', headerName: 'Serial No', width: 130 },
      { field: 'source', headerName: 'Source', width: 100 },
      {
        field: 'damagedFlag',
        headerName: 'Damaged',
        width: 90,
        renderCell: (params) => boolLabel(params.value),
      },
      {
        field: 'returnedFlag',
        headerName: 'Returned',
        width: 90,
        renderCell: (params) => boolLabel(params.value),
      },
      {
        field: 'vendorDamageReturn',
        headerName: 'Vendor Dmg Ret',
        width: 120,
        renderCell: (params) => boolLabel(params.value),
      },
      { field: 'returnPartSrNo', headerName: 'Return Sr No', width: 120 },
      {
        field: 'received',
        headerName: 'Received',
        width: 90,
        renderCell: (params) => boolLabel(params.value),
      },
      {
        field: 'salesPrice',
        headerName: 'Sales',
        width: 100,
        renderCell: (params) => formatMoney(params.value),
      },
      {
        field: 'purchasePrice',
        headerName: 'Purchase',
        width: 100,
        renderCell: (params) => formatMoney(params.value),
      },
      { field: 'replacedId', headerName: 'Replaced ID', width: 100 },
    ],
    checkboxSelection: false,
    searchable: true,
    searchPlaceholder: 'Search lines...',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 420,
  }), [lines]);

  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/inventory/orders')} sx={{ textTransform: 'none', mb: 2 }}>
          Back to Orders
        </Button>
        <Typography>Order not found.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, pt: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/inventory/orders')}
        sx={{ textTransform: 'none', mb: 2 }}
      >
        Back to Orders
      </Button>

      <Paper elevation={1} sx={{ borderRadius: '3px', mb: 3, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.8 }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 600 }}>
            Order #{order.orderId}
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ p: 2.5, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>Ticket</Typography>
            <Typography sx={{ fontSize: 14 }}>{order.ticketId ?? '-'}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>Part</Typography>
            <Typography sx={{ fontSize: 14 }}>{order.partName ?? '-'}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>Qty</Typography>
            <Typography sx={{ fontSize: 14 }}>{order.quantity ?? '-'}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>Status</Typography>
            <Typography sx={{ fontSize: 14 }}>{order.status ?? '-'}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>Total</Typography>
            <Typography sx={{ fontSize: 14 }}>{formatMoney(order.totalPrice)}</Typography>
          </Box>
        </Box>
      </Paper>

      <List config={config} />
    </Box>
  );
}
