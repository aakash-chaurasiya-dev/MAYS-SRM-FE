import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Tabs, Tab, TextField, Paper, CircularProgress, Stack, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { List } from '../../stereotype/AbstractList';
import api from '../../services/api';

export default function UserEntryReportPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // States
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [localRows, setLocalRows] = useState([]);
  const [fetchedPages, setFetchedPages] = useState(new Set());

  // Tabs structure: Total, Inward, Outward, Enquiry, Ticket Status Enquiry, Others
  const tabLabels = ['Total', 'Inward', 'Outward', 'Enquiry', 'Ticket Status Enquiry', 'Others'];

  // 1. Fetch Counts for Tabs (Depends on date range)
  const { data: countsData, isLoading: loadingCounts } = useQuery({
    queryKey: ['user-entry-counts', isCustomRange ? dateRange : 'today'],
    queryFn: async () => {
      let url = '/user-entry-reports/counts';
      if (isCustomRange && dateRange.start && dateRange.end) {
        url += `?start=${dateRange.start}&end=${dateRange.end}`;
      }
      const res = await api.get(url);
      return res.data;
    },
    refetchInterval: isCustomRange ? false : 60000, // only auto-refresh if looking at today
  });

  const tabCounts = useMemo(() => {
    if (!countsData) return [0, 0, 0, 0, 0, 0];
    return [
      countsData.total,
      countsData.inward,
      countsData.outward,
      countsData.enquiry,
      countsData.ticketStatusCheck,
      countsData.others
    ];
  }, [countsData]);

  // 2. Fetch Initial Default "Today" Pages (Page 0 and 1 concurrently, as requested)
  const { data: todayInitialData, isLoading: loadingTodayInitial } = useQuery({
    queryKey: ['user-entry-today-initial'],
    queryFn: async () => {
      const [res0, res1] = await Promise.all([
        api.get('/user-entry-reports/today?offset=0&limit=10'),
        api.get('/user-entry-reports/today?offset=1&limit=10')
      ]);
      const combined = [...(res0.data?.content || []), ...(res1.data?.content || [])];
      return Array.from(new Map(combined.map(item => [item.entryNo, item])).values());
    },
    enabled: !isCustomRange,
  });

  // 3. Fetch Custom Date Range
  const { data: customRangeData, isLoading: loadingCustomRange } = useQuery({
    queryKey: ['user-entry-range', dateRange.start, dateRange.end],
    queryFn: async () => {
      const res = await api.get(`/user-entry-reports/range?start=${dateRange.start}&end=${dateRange.end}&offset=0&limit=1000`);
      return res.data?.content || [];
    },
    enabled: isCustomRange && !!dateRange.start && !!dateRange.end,
  });

  useEffect(() => {
    if (isCustomRange && customRangeData) {
      setLocalRows(customRangeData);
    } else if (!isCustomRange && todayInitialData) {
      setLocalRows(todayInitialData);
      setFetchedPages(new Set([0, 1]));
    }
  }, [isCustomRange, customRangeData, todayInitialData]);

  // Handle pagination (fetch next pages for Today)
  const handlePaginationChange = async (newModel) => {
    if (isCustomRange) return; // Custom range currently fetches all or handles its own

    const page = newModel.page;
    if (!fetchedPages.has(page)) {
      try {
        const queryKey = ['user-entry-today-page', page, newModel.pageSize];

        const res = await queryClient.fetchQuery({
          queryKey,
          queryFn: () => api.get(`/user-entry-reports/today?offset=${page}&limit=${newModel.pageSize}`),
          staleTime: 600000
        });

        const newContent = res.data?.content || [];
        setLocalRows(prev => {
          const combined = [...prev, ...newContent];
          return Array.from(new Map(combined.map(item => [item.entryNo, item])).values());
        });
        setFetchedPages(prev => new Set(prev).add(page));
      } catch (err) {
        console.error('Failed to fetch next page', err);
      }
    }
  };

  const handleApplyRange = () => {
    if (dateRange.start && dateRange.end) {
      setIsCustomRange(true);
    }
  };

  const handleClearRange = () => {
    setDateRange({ start: '', end: '' });
    setIsCustomRange(false);
  };

  const config = useMemo(() => ({
    title: 'User Entry Reports',
    subtitle: isCustomRange ? `Showing reports from ${dateRange.start} to ${dateRange.end}` : "Showing today's reports",
    rows: localRows.map(r => ({
      ...r,
      id: r.entryNo,
      entryDate: r.entryDate ? new Date(r.entryDate).toLocaleString() : 'N/A'
    })),
    columns: [
      { field: 'id', headerName: 'Entry No', width: 100 },
      {
        field: 'userName',
        headerName: 'User Name',
        flex: 1.5,
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{ color: 'primary.main', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={(e) => {
              e.stopPropagation(); // prevent row click if there is one
              navigate(`/users/${params.row.userId}`);
            }}
          >
            {params.value}
          </Typography>
        )
      },
      { field: 'reason', headerName: 'Reason', flex: 2, renderType: 'chip' },
      { field: 'entryDate', headerName: 'Entry Date', flex: 1.5 },
    ],
    searchable: true,
    checkboxSelection: false,
    pagination: { pageSize: 10, pageSizeOptions: [10, 20, 50] },
    onPaginationChange: handlePaginationChange,
  }), [localRows, isCustomRange, dateRange]);

  return (
    <Box sx={{ p: 2 }}>
      {/* ── Status Count Tabs ── */}
      <Paper sx={{ mb: 3, p: 0, overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 2, borderBottom: 1, borderColor: 'divider', bgcolor: theme.palette.background.default }}>
          {tabLabels.map((label, idx) => (
            <Paper key={idx} elevation={0} sx={{ flex: 1, p: 1.5, minWidth: 130, display: 'flex', flexDirection: 'column', alignItems: 'center', border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', mb: 0.5 }}>{label}</Typography>
              {loadingCounts ? (
                <CircularProgress size={16} />
              ) : (
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', lineHeight: 1 }}>
                  {tabCounts[idx]}
                </Typography>
              )}
            </Paper>
          ))}
        </Box>

        {/* ── Date Filters ── */}
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', bgcolor: theme.palette.background.default }}>
          <Typography variant="subtitle2" color="text.secondary">Filter by Date:</Typography>
          <TextField
            type="date"
            size="small"
            label="Start Date"
            InputLabelProps={{ shrink: true }}
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            sx={{
              '& input': {
                color: dateRange.start ? 'inherit' : 'transparent'
              }
            }}
          />
          <TextField
            type="date"
            size="small"
            label="End Date"
            InputLabelProps={{ shrink: true }}
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            sx={{
              '& input': {
                color: dateRange.end ? 'inherit' : 'transparent'
              }
            }}
          />
          <Button variant="contained" onClick={handleApplyRange} disabled={!dateRange.start || !dateRange.end}>
            Apply
          </Button>
          {isCustomRange && (
            <Button variant="outlined" color="error" onClick={handleClearRange}>
              Clear (Show Today)
            </Button>
          )}
        </Box>
      </Paper>

      {/* ── Table ── */}
      <List config={config} />
    </Box>
  );
}
