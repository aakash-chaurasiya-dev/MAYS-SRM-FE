import { Box, Typography, Paper, Divider, CircularProgress, Chip, Stack, Button } from '@mui/material';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const sourceColor = (source) => {
  switch (source) {
    case 'VENDOR': return '#1565c0';
    case 'MARKET': return '#6a1b9a';
    case 'STOCK_OUT': return '#2e7d32';
    case 'STOCK_IN': return '#ef6c00';
    default: return '#616161';
  }
};

export default function TicketParts({ ticketId, isNormalUser }) {
  const theme = useTheme();
  const navigate = useNavigate();

  const { data: parts = [], isLoading } = useQuery({
    queryKey: ['ticket-parts', ticketId],
    queryFn: async () => {
      const res = await api.get(`/parts/ticket/${ticketId}`);
      return res.data?.data || res.data || [];
    },
    enabled: !!ticketId && !isNormalUser,
  });

  if (isNormalUser) return null;

  return (
    <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5, width: '100%' }}>
      <Box sx={{ px: 2.5, py: 1.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BuildOutlinedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
          <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Parts / Orders</Typography>
        </Box>
        <Button
          size="small"
          endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
          onClick={() => navigate('/inventory/parts')}
          sx={{ textTransform: 'none', fontSize: 12 }}
        >
          Manage
        </Button>
      </Box>
      <Divider />
      <Box sx={{ p: 2.5 }}>
        {isLoading ? (
          <CircularProgress size={24} />
        ) : parts.length === 0 ? (
          <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
            No parts linked to this ticket yet.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {parts.map((part) => {
              const color = sourceColor(part.source);
              return (
                <Box
                  key={part.partId}
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.2,
                    bgcolor: theme.palette.grey[50],
                    borderRadius: '4px',
                  }}
                >
                  <Chip
                    size="small"
                    label={part.source || '—'}
                    sx={{ bgcolor: `${color}1A`, color, fontWeight: 600, borderRadius: '4px' }}
                  />
                  <Typography sx={{ fontSize: 13, fontWeight: 600, flex: 1, minWidth: 120 }}>
                    {part.productName || part.partName || 'Unnamed part'}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                    Qty: {part.quantity}
                  </Typography>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={part.statusName || 'No status'}
                    sx={{ borderRadius: '4px', fontSize: 11 }}
                  />
                  {part.defectiveReturned && (
                    <Chip size="small" color="error" label="Defective returned" sx={{ borderRadius: '4px', fontSize: 11 }} />
                  )}
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
