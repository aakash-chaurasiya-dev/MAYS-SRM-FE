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

const INVOICE_COLUMNS = [
  { field: 'invoiceNo', headerName: 'Invoice No', width: 130, renderType: 'link' },
  { field: 'ticketId', headerName: 'Ticket ID', width: 110 },
  { field: 'customerName', headerName: 'Customer Name', width: 200 },
  { field: 'date', headerName: 'Date', width: 130 },
  { field: 'amount', headerName: 'Amount', width: 130 },
  { field: 'gstAmount', headerName: 'GST Amount', width: 130 },
  {
    field: 'paymentStatus', headerName: 'Payment Status', width: 150, renderType: 'chip',
    chipColorMap: { 'Paid': 'success', 'Pending': 'warning', 'Overdue': 'error' },
  },
];

/* ── Analytics Card: Total Outstanding ── */
function OutstandingCard({ value, trend }) {
  const theme = useTheme();
  return (
    <Paper elevation={1} sx={{ p: 2.5, borderRadius: '12px', border: `1px solid ${theme.palette.divider}` }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Total Outstanding
        </Typography>
        <AccountBalanceWalletOutlinedIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
      </Box>
      <Typography sx={{ fontSize: '28px', fontWeight: 700 }}>{value}</Typography>
      <LinearProgress
        variant="determinate"
        value={65}
        sx={{ mt: 2, mb: 1, height: 4, borderRadius: 2, bgcolor: theme.palette.action.hover,
          '& .MuiLinearProgress-bar': { bgcolor: theme.palette.primary.main } }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <TrendingUpIcon sx={{ fontSize: 14, color: theme.palette.error.main }} />
        <Typography sx={{ fontSize: '10px', color: theme.palette.text.secondary }}>8% higher than last month</Typography>
      </Box>
    </Paper>
  );
}

/* ── Analytics Card: Settled This Week ── */
function SettledCard({ value }) {
  const theme = useTheme();
  const bars = [60, 40, 80, 100, 50];
  return (
    <Paper elevation={1} sx={{ p: 2.5, borderRadius: '12px', border: `1px solid ${theme.palette.divider}` }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Settled This Week
        </Typography>
        <TaskAltOutlinedIcon sx={{ color: '#016c47', fontSize: 20 }} />
      </Box>
      <Typography sx={{ fontSize: '28px', fontWeight: 700 }}>{value}</Typography>
      <Box sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 24 }}>
        {bars.map((h, i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              height: `${h}%`,
              borderRadius: '2px 2px 0 0',
              bgcolor: i === 3 ? '#016c47' : 'rgba(1,108,71,0.2)',
            }}
          />
        ))}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <TrendingUpIcon sx={{ fontSize: 14, color: '#016c47' }} />
        <Typography sx={{ fontSize: '10px', color: theme.palette.text.secondary }}>22 invoices closed</Typography>
      </Box>
    </Paper>
  );
}

/* ── Analytics Card: Avg Payment Time ── */
function AvgPaymentCard({ value }) {
  const theme = useTheme();
  return (
    <Paper elevation={1} sx={{ p: 2.5, borderRadius: '12px', border: `1px solid ${theme.palette.divider}` }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Avg Payment Time
        </Typography>
        <ScheduleOutlinedIcon sx={{ color: '#7b2600', fontSize: 20 }} />
      </Box>
      <Typography sx={{ fontSize: '28px', fontWeight: 700 }}>{value}</Typography>
      <Box sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#016c47' }}>FAST</Typography>
        <Box sx={{ flex: 1, position: 'relative', height: 4, bgcolor: theme.palette.action.hover, borderRadius: 2 }}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '20%', transform: 'translate(-50%, -50%)',
            width: 12, height: 12, bgcolor: 'background.paper',
            border: `2px solid ${theme.palette.primary.main}`, borderRadius: '50%',
          }} />
        </Box>
        <Typography sx={{ fontSize: '11px', fontWeight: 700, color: theme.palette.error.main }}>SLOW</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <ArrowDownwardIcon sx={{ fontSize: 14, color: '#016c47' }} />
        <Typography sx={{ fontSize: '10px', color: theme.palette.text.secondary }}>Improved by 0.5 days</Typography>
      </Box>
    </Paper>
  );
}

/* ── Analytics Card: Late Accounts ── */
function LateAccountsCard({ value }) {
  const theme = useTheme();
  return (
    <Paper elevation={1} sx={{
      p: 2.5, borderRadius: '12px',
      border: `2px solid rgba(186,26,26,0.2)`,
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Late Accounts
        </Typography>
        <WarningAmberOutlinedIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />
      </Box>
      <Typography sx={{ fontSize: '28px', fontWeight: 700, color: theme.palette.error.main }}>{value}</Typography>
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography sx={{ fontSize: '10px', fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Risk Level
          </Typography>
          <Typography sx={{ fontSize: '10px', fontWeight: 700, color: theme.palette.error.main, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Elevated
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={40}
          sx={{ height: 4, borderRadius: 2, bgcolor: theme.palette.action.hover,
            '& .MuiLinearProgress-bar': { bgcolor: theme.palette.error.main } }}
        />
      </Box>
      <Typography sx={{ mt: 1, fontSize: '10px', color: theme.palette.text.secondary }}>
        Requires immediate follow-up
      </Typography>
    </Paper>
  );
}

/* ── Invoice History Page ── */
export default function InvoiceHistoryPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/invoices')
      .then(res => res.json())
      .then(data => {
        setInvoices(data || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const mappedRows = invoices.map(inv => ({
    id: inv.invoiceId,
    invoiceNo: `#INV-${inv.invoiceId}`,
    ticketId: inv.ticketId ? `#TK-${inv.ticketId}` : 'N/A',
    customerName: inv.customerName || inv.userMaster
      ? `${inv.userMaster?.firstName || ''} ${inv.userMaster?.lastName || ''}`.trim()
      : 'Unknown',
    date: inv.invoiceDate
      ? new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'N/A',
    amount: inv.totalAmount != null ? `₹${Number(inv.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'N/A',
    gstAmount: inv.gstAmount != null ? `₹${Number(inv.gstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'N/A',
    paymentStatus: inv.paymentStatus || 'Pending',
  }));

  // Analytics
  const totalOutstanding = invoices
    .filter(i => i.paymentStatus !== 'Paid')
    .reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
  const settledThisWeek = (() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return invoices
      .filter(i => i.paymentStatus === 'Paid' && new Date(i.invoiceDate) >= weekAgo)
      .reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
  })();
  const lateCount = invoices.filter(i => i.paymentStatus === 'Overdue').length;

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
        onClick: () => {},
        variant: 'outlined',
        color: 'inherit',
      },
      {
        label: 'Export CSV',
        icon: <DownloadOutlinedIcon />,
        onClick: () => {},
        variant: 'outlined',
        color: 'inherit',
      },
      {
        label: 'New Invoice',
        icon: <AddOutlinedIcon />,
        onClick: () => navigate('/billing/create'),
        variant: 'contained',
      },
    ],
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
          Invoice History
        </Typography>
        <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
          Manage and track all customer transactions and billing records.
        </Typography>
      </Box>

      {/* ── Transactions Table ── */}
      <List config={listConfig} />

      {/* ── Analytics Cards ── */}
      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        <OutstandingCard value={invoices.length ? fmtCurrency(totalOutstanding) : '—'} />
        <SettledCard value={invoices.length ? fmtCurrency(settledThisWeek) : '—'} />
        <AvgPaymentCard value="4.2 Days" />
        <LateAccountsCard value={lateCount} />
      </Box>
    </Box>
  );
}
