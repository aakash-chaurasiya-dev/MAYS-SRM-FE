import { useMemo } from 'react';
import { Box, Typography, Card, CardContent, Chip, Stack } from '@mui/material';
import PauseCircleOutlinedIcon from '@mui/icons-material/PauseCircleOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

const statusChip = (status) => {
  switch (status) {
    case 'PENDING':
      return { label: 'Awaiting Hold Approval', color: 'warning' };
    case 'APPROVED':
      return { label: 'SLA Paused (Hold Approved)', color: 'info' };
    default:
      return null;
  }
};

export default function SlaHoldRequestPanel({ ticketId }) {
  const { data: activeHold } = useQuery({
    queryKey: ['sla-hold-active', ticketId],
    queryFn: async () => {
      const res = await api.get(`/sla-hold-requests/ticket/${ticketId}/active`);
      if (res.status === 204) return null;
      return res.data;
    },
    enabled: !!ticketId,
  });

  const chip = useMemo(() => statusChip(activeHold?.status), [activeHold]);

  if (!activeHold || !chip) return null;

  return (
    <Card sx={{ mt: 2, borderRadius: '8px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          {activeHold.status === 'PENDING' ? (
            <HourglassEmptyIcon sx={{ color: 'warning.main', fontSize: 20 }} />
          ) : (
            <PauseCircleOutlinedIcon sx={{ color: 'info.main', fontSize: 20 }} />
          )}
          <Typography variant="h6" sx={{ fontSize: '15px', fontWeight: 600 }}>
            SLA Hold
          </Typography>
          <Chip label={chip.label} color={chip.color} size="small" />
        </Stack>
        {activeHold.reason && (
          <Typography sx={{ fontSize: '13px', color: 'text.secondary' }}>
            <strong>Reason:</strong> {activeHold.reason}
          </Typography>
        )}
        {activeHold.requestedByName && (
          <Typography sx={{ fontSize: '12px', color: 'text.secondary', mt: 0.5 }}>
            Requested by {activeHold.requestedByName}
            {activeHold.requestedAt ? ` · ${new Date(activeHold.requestedAt).toLocaleString()}` : ''}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
