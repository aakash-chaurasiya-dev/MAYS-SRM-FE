import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, LinearProgress,
} from '@mui/material';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import List from '../../stereotype/AbstractList/List';
import api from '../../services/api';

const INVOICE_COLUMNS = [
  { field: 'invoiceNo', headerName: 'Billing ID', width: 130 },
  { field: 'ticketId', headerName: 'Ticket ID', width: 110 },
  { field: 'customerName', headerName: 'Customer Name', width: 200 },
  { field: 'amount', headerName: 'Amount', width: 130 },
  { field: 'date', headerName: 'Date', width: 130 },
  {
    field: 'paymentStatus', headerName: 'Status', width: 150, renderType: 'chip',
    chipColorMap: { 'Paid': 'success', 'Pending': 'warning', 'Overdue': 'error', 'Failed': 'error' },
  },
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

export default function BillingDetailsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [fetchedPages, setFetchedPages] = useState(new Set());

  // 1. Initial Data Fetch (Pages 0 and 1)
  const { data: initialInvoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ['billing-final-charges-list'],
    queryFn: async () => {
      const [res0, res1] = await Promise.all([
        api.get(`/billing/final-charges/paginated?offset=0&limit=10`),
        api.get(`/billing/final-charges/paginated?offset=1&limit=10`)
      ]);
      const combined = [...(res0.data.content || []), ...(res1.data.content || [])];
      return Array.from(new Map(combined.map(item => [item.billingId, item])).values());
    }
  });

  // Sync React Query data to local state for custom pagination append
  useEffect(() => {
    if (initialInvoices) {
      setInvoices(initialInvoices);
      setFetchedPages(new Set([0, 1]));
    }
  }, [initialInvoices]);

  // 2. Prefetch Logic Triggered by Grid Navigation
  const handlePaginationChange = useCallback(async (newModel) => {
    const currentPage = newModel.page;
    const nextPage = currentPage + 1; // Always prefetch the next contiguous page
    
    if (!fetchedPages.has(nextPage)) {
      try {
        const res = await api.get(`/billing/final-charges/paginated?offset=${nextPage}&limit=${newModel.pageSize}`);
        const newInvoices = res.data.content || [];
        
        if (newInvoices.length > 0) {
          setInvoices(prev => {
            const combined = [...prev, ...newInvoices];
            return Array.from(new Map(combined.map(item => [item.billingId, item])).values());
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
  }, [fetchedPages]);

  const mappedRows = invoices.map(inv => ({
    id: inv.billingId,
    invoiceNo: `#INV-${inv.billingId}`,
    ticketId: inv.ticketId ? `#TK-${inv.ticketId}` : 'N/A',
    rawTicketId: inv.ticketId,
    customerName: inv.customerName || '-',
    date: inv.billingDate
      ? new Date(inv.billingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'N/A',
    amount: inv.amount != null ? `₹${Number(inv.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'N/A',
    paymentStatus: inv.statusName || 'Pending',
  }));

  const totalOutstanding = invoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const settledThisWeek = invoices
    .filter(i => i.statusName === 'Paid')
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const lateCount = invoices.filter(i => i.statusName === 'Overdue' || i.statusName === 'Failed').length;

  const fmtCurrency = (n) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const STATS = [
    {
      title: 'Total Revenue', value: fmtCurrency(totalOutstanding),
      icon: <AccountBalanceWalletOutlinedIcon />,
      iconColor: '#0052cc', iconBg: '#0052cc14',
    },
    {
      title: 'Paid Invoices', value: fmtCurrency(settledThisWeek),
      icon: <TaskAltOutlinedIcon />,
      iconColor: '#006c47', iconBg: '#006c4714',
    },
    {
      title: 'Overdue/Failed', value: lateCount,
      icon: <WarningAmberOutlinedIcon />,
      iconColor: '#d32f2f', iconBg: '#d32f2f14',
    },
  ];

  const listConfig = {
    title: 'Transactions',
    subtitle: 'All customer billing records',
    rows: mappedRows,
    columns: INVOICE_COLUMNS,
    actions: [
      {
        label: 'Filter',
        icon: <FilterListOutlinedIcon />,
        onClick: () => { },
        variant: 'outlined',
        color: 'inherit',
      },
      {
        label: 'Export CSV',
        icon: <DownloadOutlinedIcon />,
        onClick: () => { },
        variant: 'outlined',
        color: 'inherit',
      },
    ],
    onRowClick: (params) => navigate(`/billing/create?ticketId=${params.row.rawTicketId}`),
    pagination: { pageSize: 10 },
    onPaginationChange: handlePaginationChange,
    searchPlaceholder: 'Search invoices, clients…',
    getRowId: (row) => row.id,
    height: 480,
  };

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
          Billing Details
        </Typography>
        <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
          Manage and track all customer transactions and billing records.
        </Typography>
      </Box>

      {/* ── Stat Cards Row ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(3, 1fr)',
          },
          gap: 2, mb: 3,
        }}
      >
        {STATS.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </Box>

      <List config={{ ...listConfig, loading: loadingInvoices }} />
    </Box>
  );
}
