import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Box, Typography, Card, CardContent, Divider, CircularProgress,
    Button, Avatar, useTheme, Chip, Stack
} from '@mui/material';
import api from '../../services/api';

export default function UserProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();

    // 1. Fetch User Details
    const { data: user, isLoading: loadingUser } = useQuery({
        queryKey: ['user', id],
        queryFn: async () => {
            const res = await api.get(`/users/${id}`);
            return res.data?.data || res.data;
        },
        staleTime: 60 * 60 * 1000, // Cache for 5 mins
    });

    // 2. Fetch User's Tickets
    const { data: rawTickets = [], isLoading: loadingTickets } = useQuery({
        queryKey: ['userTickets', id],
        queryFn: async () => {
            const res = await api.get(`/tickets/user/${id}`);
            return res.data?.data || res.data || [];
        },
        staleTime: 60 * 60 * 1000,
    });

    // Sort tickets by createdDate descending (newest first)
    const tickets = React.useMemo(() => {
        return [...rawTickets].sort((a, b) => {
            if (!a.createdDate) return 1;
            if (!b.createdDate) return -1;
            return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
        });
    }, [rawTickets]);

    const loading = loadingUser || loadingTickets;

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit'
        });
    };

    if (loading) {
        return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
    }

    if (!user) {
        return <Box p={4}><Typography>User not found.</Typography></Box>;
    }

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

    return (
        <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 100px)', overflow: 'hidden' }}>

            {/* Left Panel: Profile View (35%) */}
            <Box sx={{ width: '35%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                        <Avatar sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.dark', fontSize: '2.5rem' }}>
                            {user.firstName?.charAt(0) || 'U'}
                        </Avatar>
                        <Typography variant="h5" fontWeight="bold">{fullName}</Typography>
                        <Typography variant="body2" color="text.secondary">{user.emailId || 'No Email'}</Typography>

                        <Chip
                            label={user.isActive ? 'Active User' : 'Inactive User'}
                            size="small"
                            sx={{
                                mt: 1.5,
                                fontWeight: 600,
                                bgcolor: user.isActive ? `${theme.palette.success.main}1A` : `${theme.palette.error.main}1A`,
                                color: user.isActive ? 'success.main' : 'error.main'
                            }}
                        />
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <CardContent sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">Contact Number</Typography>
                            <Typography variant="body1" fontWeight={500}>{user.mobileNo || 'N/A'}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">Branch</Typography>
                            <Typography variant="body1" fontWeight={500}>{user.branchName || 'N/A'}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">Address</Typography>
                            <Typography variant="body1" fontWeight={500}>{user.address || 'N/A'}</Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* Right Panel: Ticket History (65%) */}
            <Box sx={{ width: '65%', display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', p: 1 }}>
                    <Box p={2} borderBottom={`1px solid ${theme.palette.divider}`} display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={1}>
                            {/* <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} /> */}
                            <Typography variant="h6" fontWeight="bold">Ticket History</Typography>
                        </Box>
                        <Chip label={`${tickets.length} Tickets`} size="small" color="primary" variant="outlined" />
                    </Box>
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                        {tickets.length === 0 ? (
                            <Typography color="text.secondary" align="center" mt={4}>
                                No tickets found for this user.
                            </Typography>
                        ) : (
                            <Stack spacing={2}>
                                {tickets.map(ticket => (
                                    <Card
                                        key={ticket.ticketId}
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            transition: 'box-shadow 0.2s',
                                            cursor: 'pointer',
                                            '&:hover': { boxShadow: theme.shadows[3] }
                                        }}
                                        onClick={() => navigate(`/tickets/${ticket.ticketId}`)}
                                    >
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                            <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                                                {ticket.ticketDescription ? ticket.ticketDescription.substring(0, 50) + (ticket.ticketDescription.length > 50 ? '...' : '') : ticket.ticketTypeName || `Ticket #${ticket.ticketId}`}
                                            </Typography>
                                            <Chip
                                                label={ticket.ticketStatusName || 'OPEN'}
                                                size="small"
                                                sx={{
                                                    fontWeight: 'bold', fontSize: '0.7rem',
                                                    bgcolor: ticket.ticketStatusName === 'CLOSED' ? `${theme.palette.error.main}1A` : `${theme.palette.success.main}1A`,
                                                    color: ticket.ticketStatusName === 'CLOSED' ? 'error.main' : 'success.main'
                                                }}
                                            />
                                        </Box>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                            <strong>Issue:</strong> {ticket.ticketTypeName || 'N/A'}
                                        </Typography>

                                        <Box display="flex" gap={4}>
                                            <Box>
                                                <Typography variant="caption" color="text.disabled" display="block">Created Date</Typography>
                                                <Typography variant="body2" fontWeight={500}>{formatDateTime(ticket.createdDate)}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" color="text.disabled" display="block">SLA (Target Date)</Typography>
                                                <Typography variant="body2" fontWeight={500}>{formatDateTime(ticket.targetDate)}</Typography>
                                            </Box>
                                        </Box>
                                    </Card>
                                ))}
                            </Stack>
                        )}
                    </Box>
                </Card>
            </Box>


        </Box>
    );
}
