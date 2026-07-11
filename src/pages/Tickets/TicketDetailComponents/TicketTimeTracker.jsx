import React, { useMemo } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Link, Avatar, Divider, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Link as RouterLink } from 'react-router-dom';
import api from '../../../services/api';

/**
 * Calculates total minutes elapsed since a given ISO date string.
 */
const getMinutesSince = (dateString) => {
  if (!dateString) return 0;
  const start = new Date(dateString).getTime();
  const now = new Date().getTime();
  return Math.floor((now - start) / 60000);
};

/**
 * Formats total minutes into "Xh Ym".
 */
const formatMinutes = (totalMinutes) => {
  if (!totalMinutes || totalMinutes <= 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export default function TicketTimeTracker({ ticketId }) {
  const { data: trackingRecords, isLoading, error } = useQuery({
    queryKey: ['ticket-time-tracking', ticketId],
    queryFn: async () => {
      const res = await api.get(`/ticket-time-tracking/ticket/${ticketId}`);
      return res.data;
    },
    refetchInterval: 60000, // Refetch every minute to update active timers
  });

  const employeeStats = useMemo(() => {
    if (!trackingRecords || !Array.isArray(trackingRecords)) return [];

    const statsMap = new Map();

    trackingRecords.forEach((record) => {
      if (!record.assigneeId) return;

      const currentMinutes = record.accumulatedMinutes || 0;
      const activeMinutes = record.isActive ? getMinutesSince(record.lastClockStart) : 0;
      const totalSessionMinutes = currentMinutes + activeMinutes;

      if (statsMap.has(record.assigneeId)) {
        const existing = statsMap.get(record.assigneeId);
        existing.totalMinutes += totalSessionMinutes;
      } else {
        statsMap.set(record.assigneeId, {
          assigneeId: record.assigneeId,
          assigneeName: record.assigneeName || 'Unknown Employee',
          totalMinutes: totalSessionMinutes,
        });
      }
    });

    return Array.from(statsMap.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [trackingRecords]);

  if (isLoading) {
    return (
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error || employeeStats.length === 0) {
    return null; // Don't show the section if there's no tracking data
  }

  return (
    <Card sx={{ mt: 2, borderRadius: '8px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <AccessTimeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Typography variant="h6" sx={{ fontSize: '15px', fontWeight: 600 }}>
            Time Spent
          </Typography>
        </Stack>

        <Stack spacing={1.5}>
          {employeeStats.map((stat) => (
            <Box key={stat.assigneeId} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 32, height: 32, fontSize: '14px', bgcolor: 'primary.light', color: 'primary.main' }}>
                  {stat.assigneeName.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Link
                    component={RouterLink}
                    to={`/employees/${stat.assigneeId}`}
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      fontSize: '13px',
                      textDecoration: 'none',
                      '&:hover': { color: 'primary.main', textDecoration: 'underline' }
                    }}
                  >
                    {stat.assigneeName}
                  </Link>
                  <Typography variant="body2" sx={{ fontSize: '11px', color: 'text.secondary' }}>
                    ID: {stat.assigneeId}
                  </Typography>
                </Box>
              </Box>
              <Typography sx={{ fontWeight: 600, fontSize: '14px', color: 'primary.main' }}>
                {formatMinutes(stat.totalMinutes)}
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
