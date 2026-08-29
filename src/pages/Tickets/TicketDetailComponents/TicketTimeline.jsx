import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Dialog,
  DialogContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

/**
 * formatTimestamp
 * Extracted helper to safely format dates.
 */
const formatTimestamp = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

const COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'modifiedBy', label: 'Modified By' },
  { key: 'assigned', label: 'Assigned By' },
  { key: 'remark', label: 'Remark', align: 'center' },
  { key: 'assignedTo', label: 'Assigned To' },
  { key: 'status', label: 'Status' },
];

/**
 * TicketTimeline
 *
 * Renders up to 10 activity logs as a single-row table.
 * "See More" opens the full ticket logs modal.
 */
export default function TicketTimeline({ ticketId, timeline = [] }) {
  const theme = useTheme();
  const [logDetailModalOpen, setLogDetailModalOpen] = useState(false);

  const { data: fullLogs = [], isLoading } = useQuery({
    queryKey: ['ticket-logs', ticketId],
    queryFn: async () => {
      const res = await api.get(`/ticket-logs/${ticketId}`);
      return res.data;
    },
    enabled: !!(logDetailModalOpen && ticketId),
    staleTime: 5 * 60 * 1000,
  });

  const entries = timeline.slice(0, 10);

  const cellSx = {
    fontSize: '12px',
    py: 1,
    px: 1.5,
    borderColor: theme.palette.divider,
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
  };

  const headCellSx = {
    ...cellSx,
    fontSize: '11px',
    fontWeight: 700,
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    bgcolor: theme.palette.action.hover,
  };

  return (
    <>
      <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5, height: 'auto' }}>
        <Box sx={{ px: 2.5, py: 1.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Activity Timeline</Typography>
          <Button
            size="small"
            variant="text"
            sx={{ fontSize: '11px', minWidth: 0, p: '2px 6px' }}
            onClick={() => setLogDetailModalOpen(true)}
          >
            See More
          </Button>
        </Box>
        <Divider />
        {entries.length === 0 ? (
          <Box sx={{ p: 2.5 }}>
            <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
              No activity available for this ticket yet.
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ tableLayout: 'auto', minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  {COLUMNS.map((col) => (
                    <TableCell
                      key={col.key}
                      align={col.align || 'left'}
                      sx={{
                        ...headCellSx,
                        textAlign: col.align || 'left',
                      }}
                    >
                      {col.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry, i) => (
                  <TableRow key={`${entry.modifiedBy}-${entry.date}-${i}`} hover>
                    {COLUMNS.map((col) => (
                      <TableCell
                        key={col.key}
                        align={col.align || 'left'}
                        sx={{
                          ...cellSx,
                          textAlign: col.align || 'left',
                          whiteSpace: col.key === 'remark' ? 'normal' : 'nowrap',
                          maxWidth: col.key === 'remark' ? 220 : 'none',
                          wordBreak: col.key === 'remark' ? 'break-word' : 'normal',
                        }}
                      >
                        {entry[col.key] || '—'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Log Detail Modal */}
      <Dialog open={logDetailModalOpen} onClose={() => setLogDetailModalOpen(false)} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Full Ticket Logs</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '60vh', overflowY: 'auto' }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={30} />
              </Box>
            ) : fullLogs.length === 0 ? (
              <Typography>No logs found.</Typography>
            ) : (
              fullLogs.map((log, i) => (
                <Box key={log.logId || i} sx={{ p: 2, border: '1px solid', borderColor: theme.palette.divider, borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                      Modified By: {log.modifiedBy || 'System'}
                      <Typography component="span" sx={{ color: theme.palette.text.secondary, ml: 1, fontSize: '12px', fontWeight: 400 }}>
                        ({formatTimestamp(log.modificationDate)})
                      </Typography>
                    </Typography>
                    {log.logId && (
                      <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                        Log ID: {log.logId}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {log.assignorEmployeeName && (
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        <b>Assignor:</b> {log.assignorEmployeeName}
                      </Typography>
                    )}
                    {log.assigneeEmployeeName && (
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        <b>Assignee:</b> {log.assigneeEmployeeName}
                      </Typography>
                    )}
                    {(log.oldStatus || log.newStatus) && (
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        <b>Status:</b> {log.oldStatus || 'None'} &rarr; {log.newStatus || 'None'}
                      </Typography>
                    )}
                  </Box>

                  {log.assignorRemarks && (
                    <Typography variant="body2" sx={{ mt: 1, color: theme.palette.text.secondary }}>
                      <b>Remarks:</b> {log.assignorRemarks}
                    </Typography>
                  )}

                  {log.changedFields && (() => {
                    try {
                      const changes = JSON.parse(log.changedFields);
                      if (Object.keys(changes).length === 0) return null;
                      return (
                        <Box sx={{ mt: 1.5, p: 1.5, bgcolor: theme.palette.action.hover, borderRadius: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>CHANGES:</Typography>
                          {Object.entries(changes).map(([field, vals]) => (
                            <Typography key={field} variant="body2" sx={{ fontSize: '13px', display: 'flex', gap: 1, mb: 0.5 }}>
                              <Box component="span" sx={{ fontWeight: 500, minWidth: '120px' }}>{field}</Box>
                              <Box component="span" sx={{ color: theme.palette.error.main, textDecoration: 'line-through' }}>{String(vals.old)}</Box>
                              <Box component="span" sx={{ color: theme.palette.text.secondary }}>&rarr;</Box>
                              <Box component="span" sx={{ color: theme.palette.success.main }}>{String(vals.new)}</Box>
                            </Typography>
                          ))}
                        </Box>
                      );
                    } catch (e) {
                      return <Typography variant="body2" sx={{ mt: 1 }}>{log.changedFields}</Typography>;
                    }
                  })()}
                </Box>
              ))
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
