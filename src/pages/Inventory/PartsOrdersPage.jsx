import { useMemo } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { List } from '../../stereotype/AbstractList';
import api from '../../services/api';

const formatMoney = (value) => {
  if (value == null) return '-';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
};

export default function PartsOrdersPage() {
  const navigate = useNavigate();

  const { data: orders = [] } = useQuery({
    queryKey: ['parts-orders'],
    queryFn: async () => {
      const response = await api.get('/parts-orders');
      return response.data?.data || response.data || [];
    },
    select: (data) =>
      (data || []).map((row, i) => ({
        ...row,
        id: row.orderId || `fallback-id-${i}`,
      })),
    staleTime: 1000 * 60 * 5,
  });

  const config = useMemo(() => ({
    title: 'Parts Orders',
    subtitle: `${orders.length} orders`,
    rows: orders,
    columns: [
      { field: 'id', headerName: 'Order ID', width: 100 },
      { field: 'ticketId', headerName: 'Ticket', width: 100 },
      { field: 'partName', headerName: 'Part Name', width: 180, renderType: 'link' },
      { field: 'quantity', headerName: 'Qty', width: 70 },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        renderCell: (params) => params.value || '-',
      },
      {
        field: 'totalPrice',
        headerName: 'Total',
        width: 120,
        renderCell: (params) => formatMoney(params.value),
      },
      { field: 'orderedByName', headerName: 'Ordered By', width: 130 },
      {
        field: 'createdAt',
        headerName: 'Created',
        width: 150,
        renderCell: (params) => {
          if (!params.value) return '-';
          return new Date(params.value).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        },
      },
    ],
    checkboxSelection: false,
    searchable: true,
    searchPlaceholder: 'Search parts orders...',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 480,
    onRowClick: (params) => {
      if (params?.row?.orderId) navigate(`/inventory/orders/${params.row.orderId}`);
    },
  }), [orders, navigate]);

  return (
    <Box sx={{ p: 2, pt: 3 }}>
      <List config={config} />
    </Box>
  );
}
