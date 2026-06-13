import { useState, useEffect } from 'react';
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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
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



export default function BillingDetailsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await api.get('/billing/final-charges');
        const data = response.data?.data || response.data;
        setInvoices(Array.isArray(data) ? data : []);
        console.log("final Charges - ", response);

      } catch (error) {
        console.error('Failed to fetch invoices:', error);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

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

  // Analytics
  const totalOutstanding = invoices
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const settledThisWeek = (() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return invoices
      .filter(i => i.statusName === 'Paid' && new Date(i.billingDate) >= weekAgo)
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  })();
  const lateCount = invoices.filter(i => i.statusName === 'Overdue').length;

  const fmtCurrency = (n) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const listConfig = {
    title: 'Transactions',
    subtitle: 'All customer billing records',
    rows: mappedRows,
    columns: INVOICE_COLUMNS,
    loading,
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
      <List config={listConfig} />
    </Box>
  );
}
