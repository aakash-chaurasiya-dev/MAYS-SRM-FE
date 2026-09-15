import { useState, useRef } from 'react';
import { Box, Stack, Typography, Button, CircularProgress } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { getUserRole, canAccess } from '../../access/featureAccess';

// Modular components
import TicketHeader from './TicketDetailComponents/TicketHeader';
import TicketIssue from './TicketDetailComponents/TicketIssue';
import TicketCustomer from './TicketDetailComponents/TicketCustomer';
import TicketDevice from './TicketDetailComponents/TicketDevice';
import TicketAttachments from './TicketDetailComponents/TicketAttachments';
import TicketOperations from './TicketDetailComponents/TicketOperations';
import TicketTimeline from './TicketDetailComponents/TicketTimeline';
import TicketInternalUpdate from './TicketDetailComponents/TicketInternalUpdate';
import TicketAccessories from './TicketDetailComponents/TicketAccessories';
import TicketPartsSection from './TicketDetailComponents/TicketPartsSection';
import TicketProgress from './TicketDetailComponents/TicketProgress';
import TicketTimeTracker from './TicketDetailComponents/TicketTimeTracker';
import SlaHoldRequestPanel from './TicketDetailComponents/SlaHoldRequestPanel';
import TicketEnquiryOutwardPanel from './TicketDetailComponents/TicketEnquiryOutwardPanel';

const formatTimestamp = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

const createTimelineEntry = (log) => ({
  date: formatTimestamp(log?.modificationDate),
  modifiedBy: log?.modifiedBy || 'System',
  assigned: log?.assignorEmployeeName || '—',
  assignedTo: log?.assigneeEmployeeName || '—',
  status: log?.status || '—',
  remark: log?.assignorRemarks || '—',
});

export default function TicketDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const rawRole = getUserRole(user);
  const isNormalUser = rawRole === 'ROLE_USER';
  const isVendor = rawRole === 'ROLE_VENDOR';
  const isPortalUser = isNormalUser || isVendor;
  const canEditTargetDate = canAccess(user, 'editTicketTargetDate');

  const [isEditMode, setIsEditMode] = useState(false);

  const issueRef = useRef();
  const customerRef = useRef();
  const deviceRef = useRef(null);
  const operationsRef = useRef(null);
  const internalNoteRef = useRef(null);
  const accessoriesRef = useRef(null);
  const progressRef = useRef(null);

  const userTicketsCache = queryClient.getQueryData(['dashboard-ticket-list-user', user?.userId]);
  const vendorTicketsCache = queryClient.getQueryData(['dashboard-ticket-list-vendor', user?.userId]);
  const hasCacheAndIsDenied =
    isNormalUser && userTicketsCache && !userTicketsCache.some((t) => String(t.ticketId) === String(id));
  const hasVendorCacheAndIsDenied =
    isVendor && vendorTicketsCache && !vendorTicketsCache.some((t) => String(t.ticketId) === String(id));

  const { data: ticket, isLoading: isTicketLoading, error: ticketError } = useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const res = await api.get(`/tickets/${id}`);
      return res.data;
    },
    enabled: !hasCacheAndIsDenied && !hasVendorCacheAndIsDenied,
  });

  const { data: attachments = [] } = useQuery({
    queryKey: ['ticket-attachments', id],
    queryFn: async () => {
      const res = await api.get(`/tickets/${id}/attachments`);
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const { data: rawLogs = [] } = useQuery({
    queryKey: ['ticket-logs-latest', id],
    queryFn: async () => {
      const res = await api.get(`/ticket-logs/${id}/latest`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !isPortalUser,
  });

  const timeline = Array.isArray(rawLogs) ? rawLogs.map(createTimelineEntry) : [];
  const latestRemarkLog = Array.isArray(rawLogs)
    ? rawLogs.find((log) => log.assignorRemarks && log.assignorRemarks.trim() !== '')
    : null;
  const latestRemark = latestRemarkLog ? latestRemarkLog.assignorRemarks : 'No internal updates yet.';

  const updateTicketMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.patch(`/tickets/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      window.dispatchEvent(
        new CustomEvent('app-notification', {
          detail: { message: 'Ticket updated successfully!', severity: 'success' },
        })
      );

      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['ticket-logs', id] });
      queryClient.invalidateQueries({ queryKey: ['ticket-logs-latest', id] });
      queryClient.invalidateQueries({ queryKey: ['ticket-time-tracking', id] });
      queryClient.invalidateQueries({ queryKey: ['sla-hold-active', id] });
      queryClient.invalidateQueries({ queryKey: ['sla-hold-pending'] });

      if (internalNoteRef.current?.clearNote) {
        internalNoteRef.current.clearNote();
      }

      setIsEditMode(false);
    },
    onError: (err) => {
      window.dispatchEvent(
        new CustomEvent('app-notification', {
          detail: {
            message: err.response?.data?.message || 'Unable to update ticket',
            severity: 'error',
          },
        })
      );
    },
  });

  const handleSaveAll = () => {
    const issueData = issueRef.current?.getFormData() || {};
    const customerData = customerRef.current?.getFormData() || {};
    const deviceData = deviceRef.current?.getFormData() || {};
    const operationsData = operationsRef.current?.getFormData() || {};
    const noteData = internalNoteRef.current?.getFormData() || {};
    const accessoriesData = accessoriesRef.current?.getFormData() || {};
    const progressData = progressRef.current?.getFormData() || {};

    const payload = {
      ...ticket,
      modifiedByEmployeeId: user?.userId || null,
      ...issueData,
      ...customerData,
      ...deviceData,
      ...operationsData,
      ...accessoriesData,
      ...progressData,
    };

    if (noteData.remarks) {
      payload.remarks = noteData.remarks;
    } else if (operationsData.remarks) {
      payload.remarks = operationsData.remarks;
    }

    updateTicketMutation.mutate(payload);
  };

  const loading = isTicketLoading;
  const error = ticketError
    ? ticketError.response?.data?.message || ticketError.message || 'Unable to load ticket details'
    : '';

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (
    hasCacheAndIsDenied ||
    hasVendorCacheAndIsDenied ||
    (ticket && isNormalUser && String(ticket.userId) !== String(user?.userId)) ||
    (ticket && isVendor && String(ticket.vendorId) !== String(user?.userId))
  ) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', mt: 10 }}>
        <Typography variant="h5" color="error" fontWeight="bold">
          Access Denied
        </Typography>
        <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
          You do not have permission to view this ticket.
        </Typography>
        <Button sx={{ mt: 4 }} variant="contained" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <TicketHeader
        ticket={ticket}
        loading={loading}
        error={error}
        isNormalUser={isPortalUser}
        isEditMode={isEditMode}
        onNavigateBack={() => navigate(-1)}
        onNavigateBilling={() => navigate(`/billing/create?ticketId=${id}`)}
        onEditClick={() => setIsEditMode(true)}
        onCancelEdit={() => setIsEditMode(false)}
        onSaveClick={handleSaveAll}
        saving={updateTicketMutation.isPending}
      />

      {/* Enquiry-linked outward panel (Mark Outward / Outward Done) */}
      <TicketEnquiryOutwardPanel
        ticketId={id}
        ticket={ticket}
        isPortalUser={isPortalUser}
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={isPortalUser ? 0 : 2.5}
        sx={{ width: '100%' }}
      >
        <Box sx={{ flex: { xs: '1 1 auto', md: '7 1 0' }, minWidth: 0, overflow: 'hidden' }}>
          <TicketProgress
            ref={progressRef}
            ticket={ticket}
            isEditMode={isEditMode}
            canEditTargetDate={canEditTargetDate}
          />

          <TicketIssue ref={issueRef} ticket={ticket} isEditMode={isEditMode} />

          {!isPortalUser && (
            <TicketInternalUpdate
              ref={internalNoteRef}
              ticket={ticket}
              ticketId={id}
              isEditMode={isEditMode}
              latestRemark={latestRemark}
            />
          )}

          {isPortalUser ? (
            <Stack direction="row" spacing={2.5} sx={{ flexWrap: 'wrap', width: '100%' }} useFlexGap>
              <TicketCustomer
                ref={customerRef}
                ticket={ticket}
                isNormalUser={isPortalUser}
                isEditMode={isEditMode}
              />
              <TicketDevice
                ref={deviceRef}
                ticket={ticket}
                isEditMode={false}
                isNormalUser={isPortalUser}
              />
            </Stack>
          ) : (
            <TicketTimeline ticketId={id} timeline={timeline} />
          )}

          {!isPortalUser && (
            <TicketDevice
              ref={deviceRef}
              ticket={ticket}
              isEditMode={false}
              isNormalUser={isPortalUser}
              fullWidth
              oneLine
            />
          )}

          <TicketAccessories
            ref={accessoriesRef}
            ticket={ticket}
            ticketId={id}
            isEditMode={isEditMode}
            isNormalUser={isPortalUser}
          />

          <TicketPartsSection ticketId={id} isNormalUser={isPortalUser} />

          <TicketAttachments ticketId={id} attachments={attachments} />
        </Box>

        {!isPortalUser && (
          <Box sx={{ flex: { xs: '1 1 auto', md: '3 1 0' }, minWidth: '12.5rem', overflow: 'hidden' }}>
            <TicketOperations ref={operationsRef} ticket={ticket} isEditMode={isEditMode} />
            <TicketCustomer
              ref={customerRef}
              ticket={ticket}
              isNormalUser={isPortalUser}
              isEditMode={isEditMode}
              fullWidth
            />
            <SlaHoldRequestPanel ticketId={id} />
            <TicketTimeTracker ticketId={id} />
          </Box>
        )}
      </Stack>
    </Box>
  );
}