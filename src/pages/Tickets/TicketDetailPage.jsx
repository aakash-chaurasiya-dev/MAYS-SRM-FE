import React, { useState, useRef } from 'react';
import { Box, Stack } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

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
import TicketProgress from './TicketDetailComponents/TicketProgress';

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

  const rawRole = user?.roles?.[0]?.authority || user?.role || 'ROLE_USER';
  const isNormalUser = rawRole === 'ROLE_USER';

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
    enabled: !isNormalUser, // Only fetch if it's a staff member
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
      queryClient.invalidateQueries({ queryKey: ['ticket-accessories', id] });


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
    }

    updateTicketMutation.mutate(payload);
  };

  const loading = isTicketLoading;
  const error = ticketError ? (ticketError.response?.data?.message || ticketError.message || 'Unable to load ticket details') : '';

  return (
    <Box>
      <TicketHeader
        ticket={ticket}
        loading={loading}
        error={error}
        isNormalUser={isNormalUser}
        isEditMode={isEditMode}
        onNavigateBack={() => navigate(-1)}
        onNavigateBilling={() => navigate(`/billing/create?ticketId=${id}`)}
        onEditClick={() => setIsEditMode(true)}
        onCancelEdit={() => setIsEditMode(false)}
        onSaveClick={handleSaveAll}
        saving={updateTicketMutation.isPending}
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={isNormalUser ? 0 : 2.5}>

        {/* Left Column */}
        <Box sx={{ flex: isNormalUser ? 1 : 0.7 }}>
          <TicketProgress ref={progressRef} ticket={ticket} isEditMode={isEditMode} />
          
          <TicketIssue
            ref={issueRef}
            ticket={ticket}
            isEditMode={isEditMode}
          />

          <TicketInternalUpdate
            ref={internalNoteRef}
            ticket={ticket}
            ticketId={id}
            isEditMode={isEditMode}
            latestRemark={latestRemark}
          />

          <Stack direction="row" spacing={2.5} flexWrap="wrap" useFlexGap>
            <TicketCustomer
              ref={customerRef}
              ticket={ticket}
              isNormalUser={isNormalUser}
              isEditMode={isEditMode}
            />
            <TicketDevice
              ref={deviceRef}
              ticket={ticket}
              isEditMode={isEditMode}
            />
          </Stack>

          <TicketAccessories
            ref={accessoriesRef}
            ticket={ticket}
            ticketId={id}
            isEditMode={isEditMode}
          />

          <TicketAttachments
            ticketId={id}
            attachments={attachments}
          />
        </Box>

        {/* Right Column (Staff Only) */}
        {!isNormalUser && (
          <Box sx={{ flex: 0.3 }}>
            <TicketOperations
              ref={operationsRef}
              ticket={ticket}
              isEditMode={isEditMode}
            />
            <TicketTimeline
              ticketId={id}
              timeline={timeline}
            />
          </Box>
        )}
      </Stack>
    </Box>
  );
}