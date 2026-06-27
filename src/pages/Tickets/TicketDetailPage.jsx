import React, { useState, useRef } from 'react';
import { Box, Stack } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Import modular components
import TicketHeader from './components/TicketHeader';
import TicketIssue from './components/TicketIssue';
import TicketCustomer from './components/TicketCustomer';
import TicketDevice from './components/TicketDevice';
import TicketAttachments from './components/TicketAttachments';
import TicketOperations from './components/TicketOperations';
import TicketTimeline from './components/TicketTimeline';
import TicketInternalUpdate from './components/TicketInternalUpdate';

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
  const deviceRef = useRef();
  const operationsRef = useRef();
  const internalNoteRef = useRef();

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
  const { data: timeline = [] } = useQuery({
    queryKey: ['ticket-logs', id],
    queryFn: async () => {
      const res = await api.get(`/ticket-logs/${id}/latest`);
      const logsData = Array.isArray(res.data) ? res.data : [];
      return logsData.map(createTimelineEntry);
    },
    enabled: !isNormalUser, // Only fetch if it's a staff member
  });

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

    const payload = {
      ...ticket,
      modifiedByEmployeeId: user?.userId || null,
      ...issueData,
      ...customerData,
      ...deviceData,
      ...operationsData,
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
          <TicketIssue 
            ref={issueRef}
            ticket={ticket} 
            isEditMode={isEditMode}
          />

          <TicketInternalUpdate 
            ref={internalNoteRef}
            ticket={ticket} 
            ticketId={id}
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