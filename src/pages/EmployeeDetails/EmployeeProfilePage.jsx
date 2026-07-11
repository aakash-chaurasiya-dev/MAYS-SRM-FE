import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { 
    Box, Typography, Card, CardContent, Divider, Grid, CircularProgress, 
    Button, Avatar, Paper, useTheme
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import api from '../../services/api';

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
        <Typography sx={{ color: theme.palette.text.secondary, fontSize: '13px', fontWeight: 600, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: '24px', fontWeight: 700, lineHeight: 1 }}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}

export default function EmployeeProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();

    // 1. Fetch Employee Details
    const { data: employee, isLoading: loadingEmp } = useQuery({
        queryKey: ['employee', id],
        queryFn: async () => {
            const res = await api.get(`/employees/${id}`);
            return res.data?.data || res.data;
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 mins
    });

    // 2. Fetch Employee Stats
    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ['employeeStats', id],
        queryFn: async () => {
            const res = await api.get(`/ticket-time-tracking/employee/${id}/stats`);
            return res.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    // 3. Fetch Paginated History
    const {
        data: historyData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: loadingHistory
    } = useInfiniteQuery({
        queryKey: ['employeeHistory', id],
        queryFn: async ({ pageParam = 0 }) => {
            const res = await api.get(`/ticket-time-tracking/employee/${id}/history`, {
                params: { page: pageParam, size: 10 }
            });
            return res.data;
        },
        getNextPageParam: (lastPage, allPages) => {
            const nextPage = allPages.length;
            return nextPage < (lastPage.totalPages || 1) ? nextPage : undefined;
        },
        staleTime: 5 * 60 * 1000,
    });

    const loading = loadingEmp || loadingStats;
    const history = historyData ? historyData.pages.flatMap(page => page.content || []) : [];

    if (loading) {
        return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
    }

    if (!employee) {
        return <Box p={4}><Typography>Employee not found.</Typography></Box>;
    }

    return (
        <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 100px)', overflow: 'hidden' }}>
            {/* Left side (35%) */}
            <Box sx={{ width: '35%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                        <Avatar sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main', fontSize: '2.5rem' }}>
                            {employee.employeeName?.charAt(0)}
                        </Avatar>
                        <Typography variant="h5" fontWeight="bold">{employee.employeeName}</Typography>
                        <Typography variant="body1" color="text.secondary">{employee.departmentName || 'No Department'}</Typography>
                    </Box>
                    <Divider />
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Email</Typography>
                            <Typography variant="body1">{employee.email || 'N/A'}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Contact Number</Typography>
                            <Typography variant="body1">{employee.mobileNo || 'N/A'}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Address</Typography>
                            <Typography variant="body1">
                                {[employee.address, employee.city, employee.pincode].filter(Boolean).join(', ') || 'N/A'}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Status</Typography>
                            <Typography variant="body1" sx={{ color: employee.isActive ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
                                {employee.isActive ? 'Active' : 'Inactive'}
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* Right side (65%) */}
            <Box sx={{ width: '65%', display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto', pb: 4, pr: 1 }}>
                
                {/* Stats Row */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                        },
                        gap: 2,
                    }}
                >
                    <StatCard 
                        title="Total Tickets" 
                        value={stats.totalTickets} 
                        icon={<ConfirmationNumberOutlinedIcon />} 
                        iconColor="#0052cc" iconBg="#0052cc14" 
                    />
                    <StatCard 
                        title="Open Tickets" 
                        value={stats.openTickets} 
                        icon={<AutorenewOutlinedIcon />} 
                        iconColor="#B95000" iconBg="#B9500014" 
                    />
                    <StatCard 
                        title="Closed Tickets" 
                        value={stats.closedTickets} 
                        icon={<CheckCircleOutlinedIcon />} 
                        iconColor="#006c47" iconBg="#006c4714" 
                    />
                </Box>

                {/* History List */}
                <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Ticket History</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {history.map((item, index) => (
                        <Card 
                            key={`${item.ticketId}-${index}`} 
                            sx={{ 
                                cursor: 'pointer', 
                                '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                                transition: 'all 0.2s',
                                p: 2
                            }}
                            onClick={() => navigate(`/tickets/${item.ticketId}`)}
                        >
                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="subtitle1" fontWeight="bold" color="primary">
                                    Ticket #{item.ticketId}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Created: {item.createdDate ? new Date(item.createdDate).toLocaleDateString() : 'N/A'}
                                </Typography>
                            </Box>
                            
                            <Grid container spacing={1} sx={{ mb: 1 }}>
                                <Grid item xs={6}>
                                    <Typography variant="body2"><strong>User:</strong> {item.userName || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2"><strong>Hours Spent:</strong> {item.hoursSpent} hrs</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2"><strong>SLA Date:</strong> {item.slaDate ? new Date(item.slaDate).toLocaleDateString() : 'N/A'}</Typography>
                                </Grid>
                            </Grid>
                            
                            {item.finalRemark && (
                                <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                                    <Typography variant="caption" color="text.secondary">Final Remark:</Typography>
                                    <Typography variant="body2" fontStyle="italic">"{item.finalRemark}"</Typography>
                                </Box>
                            )}
                        </Card>
                    ))}
                    
                    {history.length === 0 && !loadingHistory && (
                        <Typography color="text.secondary" align="center">No ticket history found for this employee.</Typography>
                    )}
                    
                    {hasNextPage && (
                        <Button 
                            variant="outlined" 
                            onClick={() => fetchNextPage()} 
                            disabled={isFetchingNextPage}
                            sx={{ mt: 2 }}
                        >
                            {isFetchingNextPage ? <CircularProgress size={24} /> : 'Load More Tickets'}
                        </Button>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
