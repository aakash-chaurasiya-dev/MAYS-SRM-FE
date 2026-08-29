import { useState } from 'react';
import {
  Box, Typography, Paper, Divider, CircularProgress, Chip, Stack, Button,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton, Tooltip,
  Checkbox, FormControlLabel,
} from '@mui/material';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useTheme } from '@mui/material/styles';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { getUserRole, hasAnyRole } from '../../../access/featureAccess';
import TicketPartAddModal from './TicketPartAddModal';
import TicketQuotesModal from './TicketQuotesModal';
import TicketOrderPartsModal from './TicketOrderPartsModal';

const statusColor = (status) => {
  switch (status) {
    case 'APPROVED': return 'success';
    case 'REJECTED': return 'error';
    case 'QUOTED': return 'info';
    case 'ORDERED': case 'PARTIAL': return 'warning';
    case 'RECEIVED': return 'success';
    case 'CANCELLED': return 'default';
    default: return 'default';
  }
};

const approvalLabel = (val) => {
  if (val === true) return 'Approved';
  if (val === false) return 'Rejected';
  return 'Pending';
};

export default function TicketPartsSection({ ticketId, isNormalUser }) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = getUserRole(user);

  const isEngineer = role === 'ROLE_ENGINEER';
  const isManager = role === 'ROLE_MANAGER';
  const canUseQuotesOrder = hasAnyRole(user, ['ROLE_MANAGER', 'ROLE_EXECUTIVE', 'ROLE_PURCHASE']);
  const cantakeCustomerApproval = hasAnyRole(user, ['ROLE_MANAGER', 'ROLE_EXECUTIVE', 'ROLE_PURCHASE','ROLE_ADMIN']);


  const [addOpen, setAddOpen] = useState(false);
  const [quoteRow, setQuoteRow] = useState(null);
  const [orderRow, setOrderRow] = useState(null);

  const { data: parts = [], isLoading } = useQuery({
    queryKey: ['ticket-parts', ticketId],
    queryFn: async () => {
      const res = await api.get(`/ticket-parts/ticket/${ticketId}`);
      return res.data?.data || res.data || [];
    },
    enabled: !!ticketId && !isNormalUser,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, approved }) => api.patch(`/ticket-parts/${id}/approve`, { approved }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket-parts', ticketId] }),
  });

  const customerApproveMutation = useMutation({
    mutationFn: ({ id, approved }) => api.patch(`/ticket-parts/${id}/customer-approve`, { approved }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket-parts', ticketId] }),
    onError: (error) => {
      alert(error.response?.data?.message || error.message || 'Failed to update customer approval');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/ticket-parts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket-parts', ticketId] }),
  });

  const canToggleCustomerApproval = (row) => (
    cantakeCustomerApproval
    && row.managerApproval === true
    && !['ORDERED', 'PARTIAL', 'RECEIVED', 'REJECTED', 'CANCELLED'].includes(row.partStatus)
  );

  if (isNormalUser) return null;

  return (
    <>
      <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5, width: '100%' }}>
        <Box sx={{ px: 2.5, py: 1.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BuildOutlinedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
            <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Parts</Typography>
          </Box>
          {(isEngineer || isManager) && (
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setAddOpen(true)}
              sx={{ textTransform: 'none', fontSize: 12 }}
            >
              Add Part
            </Button>
          )}
        </Box>
        <Divider />
        <Box sx={{ p: 2.5, overflowX: 'auto' }}>
          {isLoading ? (
            <CircularProgress size={24} />
          ) : parts.length === 0 ? (
            <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
              No suggested parts yet.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Part</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell>Remark</TableCell>
                  <TableCell>Manager</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parts.map((row) => (
                  <TableRow key={row.ticketPartId} hover>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                        {row.partName || '—'}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                        {[row.brandName, row.deviceTypeName, row.sku].filter(Boolean).join(' · ')}
                      </Typography>
                    </TableCell>

                    <TableCell>{row.quantity}</TableCell>

                    <TableCell sx={{ maxWidth: 160 }}>
                      <Typography sx={{ fontSize: 12 }} noWrap title={row.remark}>
                        {row.remark || '—'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={approvalLabel(row.managerApproval)}
                        color={row.managerApproval === true ? 'success' : row.managerApproval === false ? 'error' : 'default'}
                        sx={{ borderRadius: '4px', fontSize: 11 }}
                      />
                    </TableCell>

                    <TableCell>
                      <FormControlLabel
                        sx={{ m: 0 }}
                        control={(
                          <Checkbox
                            size="small"
                            checked={row.customerApproval === true}
                            disabled={
                              !canToggleCustomerApproval(row)
                              || customerApproveMutation.isPending
                            }
                            onChange={(e) => customerApproveMutation.mutate({
                              id: row.ticketPartId,
                              approved: e.target.checked,
                            })}
                          />
                        )}
                        label={(
                          <Typography sx={{ fontSize: 12 }}>
                            {row.customerApproval === true ? 'Approved' : 'Pending'}
                          </Typography>
                        )}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={row.partStatus || 'REQUESTED'}
                        color={statusColor(row.partStatus)}
                        variant="outlined"
                        sx={{ borderRadius: '4px', fontSize: 11 }}
                      />
                    </TableCell>

                    <TableCell sx={{ fontSize: 12 }}>
                      {row.createdByName || '—'}
                    </TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {isManager && row.managerApproval == null && row.partStatus === 'REQUESTED' && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => approveMutation.mutate({ id: row.ticketPartId, approved: true })}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => approveMutation.mutate({ id: row.ticketPartId, approved: false })}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                          </>
                        )}

                        {canUseQuotesOrder && row.canQuote && (
                          <Tooltip title="Quotes">
                            <IconButton size="small" onClick={() => setQuoteRow(row)}>
                              <RequestQuoteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {canUseQuotesOrder && row.canOrder && (
                          <Tooltip title="Order Parts">
                            <IconButton size="small" onClick={() => setOrderRow(row)}>
                              <ShoppingCartIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {canUseQuotesOrder && row.canQuote && !row.canOrder && (
                          <Tooltip title="Customer approval required to order">
                            <span>
                              <IconButton size="small" disabled>
                                <ShoppingCartIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}

                        {(isEngineer || isManager) && ['REQUESTED', 'APPROVED'].includes(row.partStatus) && !row.orderId && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => deleteMutation.mutate(row.ticketPartId)}
                            >
                              <DeleteOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                      </Stack>

                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Paper>

      <TicketPartAddModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        ticketId={ticketId}
      />

      {quoteRow && (
        <TicketQuotesModal
          open={!!quoteRow}
          onClose={() => setQuoteRow(null)}
          ticketPart={quoteRow}
        />
      )}

      {orderRow && (
        <TicketOrderPartsModal
          open={!!orderRow}
          onClose={() => setOrderRow(null)}
          ticketPart={orderRow}
        />
      )}
    </>
  );
}
