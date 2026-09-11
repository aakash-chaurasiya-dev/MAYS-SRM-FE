import { Box, Paper, Typography, Button, Divider, CircularProgress } from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material/styles';
import api from '../../../services/api';

const ACTION_OUTWARD = 2;

/**
 * TicketEnquiryOutwardPanel
 *
 *  1. If linked enquiry exists AND ticket status = "Ready for Hand Over"
 *     AND enquiry.action !== 2 → show "Mark Outward" (portal users only)
 *  2. If enquiry.action === 2 → show "Outward Done" badge for EVERYONE
 *  3. Otherwise → render nothing
 *
 * On click → POST /enquiries/{id}/mark-action { action: 2 }
 */
export default function TicketEnquiryOutwardPanel({ ticketId, ticket, isPortalUser }) {
  const theme = useTheme();
  const queryClient = useQueryClient();

  // Fetch linked enquiry for this ticket
  const { data: enquiry, isLoading } = useQuery({
    queryKey: ['enquiry-by-ticket', ticketId],
    queryFn: async () => {
      const res = await api.get(`/enquiries/by-ticket/${ticketId}`);
      return res.data; // '' when 204
    },
    enabled: !!ticketId,
    retry: false,
    staleTime: 30_000,
  });

  // Mark outward via existing /mark-action endpoint
  const markOutwardMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/enquiries/${enquiry.enquiryId}/mark-action`, {
        action: ACTION_OUTWARD,
      });
    },
    onSuccess: () => {
      window.dispatchEvent(
        new CustomEvent('app-notification', {
          detail: { message: 'Marked as Outward successfully!', severity: 'success' },
        })
      );
      queryClient.invalidateQueries({ queryKey: ['enquiry-by-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['enquiries-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', String(ticketId)] });
    },
    onError: (err) => {
      window.dispatchEvent(
        new CustomEvent('app-notification', {
          detail: {
            message: err?.response?.data?.message || 'Failed to mark outward',
            severity: 'error',
          },
        })
      );
    },
  });

  if (isLoading || !enquiry) return null;

  const alreadyOutward = Number(enquiry.action) === ACTION_OUTWARD;

  // ── Task 2: everyone sees "Outward Done" once action === 2
  if (alreadyOutward) {
    return (
      <Paper
        elevation={1}
        sx={{
          borderRadius: '6px',
          overflow: 'hidden',
          mb: 2.5,
          border: `1px solid ${theme.palette.success.light}`,
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 1.8,
            bgcolor: `${theme.palette.success.main}08`,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Handover</Typography>
        </Box>
        <Divider />
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CheckCircleOutlinedIcon sx={{ color: theme.palette.success.main, fontSize: 30 }} />
          <Box>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 700,
                color: theme.palette.success.main,
                letterSpacing: '-0.01em',
              }}
            >
              Outward Done
            </Typography>
            <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
              Device has been handed over — linked to enquiry ENQ-{enquiry.enquiryId}.
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  }

  // ── Task 1: button for portal users, only when ticket is Ready for Hand Over
  if (!isPortalUser) return null;

  const ticketStatusName =
    ticket?.ticketStatus?.statusName ||
    ticket?.ticketStatusName ||
    ticket?.status ||
    '';
  const normalized = String(ticketStatusName).toLowerCase().replace(/[\s_]/g, '');
  const isReadyForHandover = normalized.includes('ready') && normalized.includes('hand');

  if (!isReadyForHandover) return null;

  return (
    <Paper
      elevation={1}
      sx={{
        borderRadius: '6px',
        overflow: 'hidden',
        mb: 2.5,
        border: `1px solid ${theme.palette.warning.light}`,
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 1.8,
          bgcolor: `${theme.palette.warning.main}08`,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Handover Ready</Typography>
      </Box>
      <Divider />
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>
            Your device is ready for pickup
          </Typography>
          <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary }}>
            Confirm handover to mark this ticket as outward.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="warning"
          startIcon={
            markOutwardMutation.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <LocalShippingOutlinedIcon />
            )
          }
          onClick={() => markOutwardMutation.mutate()}
          disabled={markOutwardMutation.isPending}
          sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          Mark Outward
        </Button>
      </Box>
    </Paper>
  );
}