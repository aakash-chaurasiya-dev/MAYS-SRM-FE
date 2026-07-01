import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Divider, Dialog, DialogContent, CircularProgress } from '@mui/material';
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

/**
 * TicketTimeline
 * 
 * Renders the top 3 activity logs directly in a panel.
 * Contains the "See More" modal which dynamically fetches all history for a ticket.
 */
export default function TicketTimeline({ ticketId, timeline = [] }) {
  const theme = useTheme();
  const [logDetailModalOpen, setLogDetailModalOpen] = useState(false);

  const { data: fullLogs = [], isLoading } = useQuery({
    queryKey: ['ticket-logs', ticketId],
    queryFn: async () => {
      console.log(`Fetching full logs for Ticket ID: ${ticketId}`);
      const res = await api.get(`/ticket-logs/${ticketId}`);
      return res.data;
    },
    enabled: !!(logDetailModalOpen && ticketId),
    staleTime: 5 * 60 * 1000, // 5 minutes (prevents refetching every time modal opens)
  });

  return (
    <>
      <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Activity Timeline</Typography>
          <Button size="small" variant="text" sx={{ fontSize: '11px', minWidth: 0, p: '2px 6px' }} onClick={() => setLogDetailModalOpen(true)}>
            See More
          </Button>
        </Box>
        <Divider />
        <Box sx={{ p: 2.5 }}>
          {timeline.length === 0 ? (
            <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
              No activity available for this ticket yet.
            </Typography>
          ) : (
            timeline.slice(0, 3).map((entry, i, arr) => (
              <Box key={`${entry.user}-${entry.timestamp}-${i}`} sx={{ display: 'flex', gap: 1.5, mb: i < arr.length - 1 ? 2.5 : 0, position: 'relative' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.3 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.type === 'system' ? theme.palette.text.secondary : theme.palette.primary.main, flexShrink: 0 }} />
                  {i < arr.length - 1 && <Box sx={{ width: 1, flex: 1, bgcolor: theme.palette.divider, mt: 0.5 }} />}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>
                    <Box component="span" sx={{ fontWeight: 600 }}>{entry.user}</Box>{' — '}{entry.action}
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: theme.palette.text.secondary, mt: 0.3 }}>{entry.timestamp}</Typography>
                </Box>
              </Box>
            ))
          )}
        </Box>
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
