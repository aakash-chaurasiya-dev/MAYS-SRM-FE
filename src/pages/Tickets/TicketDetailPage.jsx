import { useState, useRef } from 'react';
import { Box, Stack, Typography, Button, CircularProgress } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { getUserRole } from '../../access/featureAccess';

// Import modular components
import TicketHeader from './TicketDetailComponents/TicketHeader';
import TicketIssue from './TicketDetailComponents/TicketIssue';
import TicketCustomer from './TicketDetailComponents/TicketCustomer';
import TicketDevice from './TicketDetailComponents/TicketDevice';
import TicketAttachments from './TicketDetailComponents/TicketAttachments';
import TicketOperations from './TicketDetailComponents/TicketOperations';
import TicketTimeline from './TicketDetailComponents/TicketTimeline';
import TicketInternalUpdate from './TicketDetailComponents/TicketInternalUpdate';
import TicketAccessories from './TicketDetailComponents/TicketAccessories';
import TicketParts from './TicketDetailComponents/TicketParts';
import TicketProgress from './TicketDetailComponents/TicketProgress';
import TicketTimeTracker from './TicketDetailComponents/TicketTimeTracker';
import SlaHoldRequestPanel from './TicketDetailComponents/SlaHoldRequestPanel';

/**
 * Helper to safely format timestamp strings.
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
 * Helper to transform raw log records into timeline UI objects.
 */
const createTimelineEntry = (log) => {
  const actor = log?.modifiedBy || log?.assignorEmployeeName || 'System';
  const timestamp = formatTimestamp(log?.modificationDate);

  let actionParts = [];

  if (log?.status) {
    actionParts.push(`Status updated to ${log.status}`);
  } else if (log?.oldStatus && log?.newStatus && log.oldStatus !== log.newStatus) {
    actionParts.push(`Status updated from ${log.oldStatus} to ${log.newStatus}`);
  }

  if (log?.assigneeEmployeeName) {
    actionParts.push(`Assigned to ${log.assigneeEmployeeName}`);
  }

  if (log?.assignorRemarks) {
    actionParts.push(`Remarks: ${log.assignorRemarks}`);
  }

  const action = actionParts.length > 0 ? actionParts.join(' | ') : 'Ticket updated';

  return {
    user: actor,
    action,
    timestamp,
    type: 'update',
  };
};

/**
 * TicketDetailPage (Main Container)
 * 
 * Fetches core ticket data and delegates rendering to modular sub-components.
 * Now powered by TanStack Query for optimized data fetching and caching.
 */
export default function TicketDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const rawRole = getUserRole(user);
  const isNormalUser = rawRole === 'ROLE_USER';
  const isVendor = rawRole === 'ROLE_VENDOR';
  const isPortalUser = isNormalUser || isVendor;

  // Unified Edit State
  const [isEditMode, setIsEditMode] = useState(false);

  // Component Refs for Unified Save
  const issueRef = useRef();
  const customerRef = useRef();
  const deviceRef = useRef(null);
  const operationsRef = useRef(null);
  const internalNoteRef = useRef(null);
  const accessoriesRef = useRef(null);
  const progressRef = useRef(null);

  // 0. Cache-first Access Check for portal users
  const userTicketsCache = queryClient.getQueryData(['dashboard-ticket-list-user', user?.userId]);
  const vendorTicketsCache = queryClient.getQueryData(['dashboard-ticket-list-vendor', user?.userId]);
  const hasCacheAndIsDenied = isNormalUser && userTicketsCache && !userTicketsCache.some(t => String(t.ticketId) === String(id));
  const hasVendorCacheAndIsDenied = isVendor && vendorTicketsCache && !vendorTicketsCache.some(t => String(t.ticketId) === String(id));

  // 1. Fetch Ticket Data
  const {
    data: ticket,
    isLoading: isTicketLoading,
    error: ticketError
  } = useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      console.log(`Fetching Ticket Details for ID: ${id}`);
      const res = await api.get(`/tickets/${id}`);
      return res.data;
    },
    enabled: !hasCacheAndIsDenied && !hasVendorCacheAndIsDenied,
  });

  // 2. Fetch Attachments
  const { data: attachments = [] } = useQuery({
    queryKey: ['ticket-attachments', id],
    queryFn: async () => {
      const res = await api.get(`/tickets/${id}/attachments`);
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  // 3. Fetch Logs (Staff Only)
  const { data: rawLogs = [] } = useQuery({
    queryKey: ['ticket-logs-latest', id],
    queryFn: async () => {
      const res = await api.get(`/ticket-logs/${id}/latest`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !isPortalUser, // Only fetch if it's a staff member
  });

  const timeline = Array.isArray(rawLogs) ? rawLogs.map(createTimelineEntry) : [];
  const latestRemarkLog = Array.isArray(rawLogs) ? rawLogs.find(log => log.assignorRemarks && log.assignorRemarks.trim() !== '') : null;
  const latestRemark = latestRemarkLog ? latestRemarkLog.assignorRemarks : 'No internal updates yet.';

  // 4. Unified Update Mutation
  const updateTicketMutation = useMutation({
    mutationFn: async (payload) => {
      console.log('Unified Save Changes Payload:', payload);
      const res = await api.patch(`/tickets/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: { message: 'Ticket updated successfully!', severity: 'success' }
      }));

      // Invalidate the query to trigger a background refetch
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['ticket-logs', id] });
      queryClient.invalidateQueries({ queryKey: ['ticket-logs-latest', id] });
      queryClient.invalidateQueries({ queryKey: ['ticket-time-tracking', id] });
      queryClient.invalidateQueries({ queryKey: ['sla-hold-active', id] });
      queryClient.invalidateQueries({ queryKey: ['sla-hold-pending'] });


      // Clear the internal note text box
      if (internalNoteRef.current?.clearNote) {
        internalNoteRef.current.clearNote();
      }

      setIsEditMode(false);
    },
    onError: (err) => {
      console.error('Failed to update ticket', err);
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: { message: err.response?.data?.message || 'Unable to update ticket', severity: 'error' }
      }));
    }
  });

  const handleSaveAll = () => {
    // Collect data from child components
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

    // Only add remarks if they exist to avoid overwriting with null unnecessarily
    if (noteData.remarks) {
      payload.remarks = noteData.remarks;
    } else if (operationsData.remarks) {
      payload.remarks = operationsData.remarks;
    }

    updateTicketMutation.mutate(payload);
  };

  const loading = isTicketLoading;
  const error = ticketError ? (ticketError.response?.data?.message || ticketError.message || 'Unable to load ticket details') : '';

  // Show loading spinner while fetching data to prevent flashing the layout before access check
  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Frontend Restriction: Prevent portal users from viewing tickets they don't own
  if (
    hasCacheAndIsDenied
    || hasVendorCacheAndIsDenied
    || (ticket && isNormalUser && String(ticket.userId) !== String(user?.userId))
    || (ticket && isVendor && String(ticket.vendorId) !== String(user?.userId))
  ) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', mt: 10 }}>
        <Typography variant="h5" color="error" fontWeight="bold">Access Denied</Typography>
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

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={isPortalUser ? 0 : 2.5}>

        {/* Left Column */}
        <Box sx={{ flex: isPortalUser ? 1 : 0.7 }}>
          <TicketProgress ref={progressRef} ticket={ticket} isEditMode={isEditMode} />
          
          <TicketIssue
            ref={issueRef}
            ticket={ticket}
            isEditMode={isEditMode}
          />

          {!isPortalUser && (
            <TicketInternalUpdate
              ref={internalNoteRef}
              ticket={ticket}
              ticketId={id}
              isEditMode={isEditMode}
              latestRemark={latestRemark}
            />
          )}

          <Stack direction="row" spacing={2.5} sx={{ flexWrap: 'wrap' }} useFlexGap>
            <TicketCustomer
              ref={customerRef}
              ticket={ticket}
              isNormalUser={isPortalUser}
              isEditMode={isEditMode}
            />
            <TicketDevice
              ref={deviceRef}
              ticket={ticket}
              // isEditMode={isEditMode}
              isEditMode={false} // Kept read-only
              isNormalUser={isPortalUser}
            />
          </Stack>

          <TicketAccessories
            ref={accessoriesRef}
            ticket={ticket}
            ticketId={id}
            isEditMode={isEditMode}
            isNormalUser={isPortalUser}
          />

          <TicketParts
            ticketId={id}
            isNormalUser={isPortalUser}
          />

          <TicketAttachments
            ticketId={id}
            attachments={attachments}
          />
        </Box>

        {/* Right Column (Staff Only) */}
        {!isPortalUser && (
          <Box sx={{ flex: 0.3 }}>
            <TicketOperations
              ref={operationsRef}
              ticket={ticket}
              isEditMode={isEditMode}
            />
            <SlaHoldRequestPanel ticketId={id} />
            <TicketTimeline
              ticketId={id}
              timeline={timeline}
            />
            <TicketTimeTracker ticketId={id} />
          </Box>
        )}
      </Stack>
    </Box>
  );
}