import { useState, useRef } from 'react';
import { Box, Stack, Typography, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { getUserRole, canAccess } from '../../access/featureAccess';

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
import TicketPartsSection from './TicketDetailComponents/TicketPartsSection';
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
const createTimelineEntry = (log) => ({
  date: formatTimestamp(log?.modificationDate),
  modifiedBy: log?.modifiedBy || 'System',
  assigned: log?.assignorEmployeeName || '—',
  assignedTo: log?.assigneeEmployeeName || '—',
  status: log?.status || '—',
  remark: log?.assignorRemarks || '—',
});

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
  const canEditTargetDate = canAccess(user, 'editTicketTargetDate');

  // Unified Edit State
  const [isEditMode, setIsEditMode] = useState(false);

  // Outward Modal State
  const [openOutwardModal, setOpenOutwardModal] = useState(false);
  const [outwardForm, setOutwardForm] = useState({
    handoverToName: '',
    handoverToPhone: '',
    outwardRemarks: ''
  });

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

  const outwardMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/outward', payload);
      return res.data;
    },
    onSuccess: () => {
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: { message: 'Outward record created successfully!', severity: 'success' }
      }));
      setOpenOutwardModal(false);
      setOutwardForm({ handoverToName: '', handoverToPhone: '', outwardRemarks: '' });
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['ticket-logs', id] });
      queryClient.invalidateQueries({ queryKey: ['ticket-logs-latest', id] });
    },
    onError: (err) => {
      console.error('Failed to create outward record', err);
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: { message: err.response?.data?.message || 'Unable to outward device', severity: 'error' }
      }));
    }
  });

  const handleOutwardSubmit = () => {
    outwardMutation.mutate({
      ticketId: Number(id),
      userId: ticket?.userId,
      serialNo: ticket?.device?.serialNo || 'N/A',
      handoverToName: outwardForm.handoverToName || ticket?.userRefNo?.firstName || '',
      handoverToPhone: outwardForm.handoverToPhone || ticket?.userRefNo?.mobileNo || '',
      outwardRemarks: outwardForm.outwardRemarks
    });
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

  // ============= MAIN RENDER =============
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
        onOutwardClick={() => setOpenOutwardModal(true)}
        saving={updateTicketMutation.isPending}
      />

      {/* ===== LAYOUT FIX: Responsive two-column layout with zoom safety ===== */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={isPortalUser ? 0 : 2.5}
        sx={{
          width: '100%',
          overflow: 'hidden',   // prevents any child overflow
        }}
      >
        {/* Left Column (~70%) – contains most content */}
        <Box
          sx={{
            flex: '7 1 0',        // grow and shrink equally
            minWidth: 0,          // allows shrinking below content width
            overflow: 'hidden',   // keep children inside
          }}
        >
          <TicketProgress
            ref={progressRef}
            ticket={ticket}
            isEditMode={isEditMode}
            canEditTargetDate={canEditTargetDate}
          />

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

          <TicketPartsSection
            ticketId={id}
            isNormalUser={isPortalUser}
          />

          <TicketAttachments
            ticketId={id}
            attachments={attachments}
          />
        </Box>

        {/* Right Column (~30%) – Staff Only */}
        {!isPortalUser && (
          <Box
            sx={{
              flex: '3 1 0',              // same grow/shrink as left
              minWidth: '12.5rem',        // minimum 200px – prevents disappearing on zoom
              overflow: 'hidden',         // keep children inside
              // optional: set a basis to maintain ~30% width
              // flexBasis: '30%',
            }}
          >
            <TicketOperations
              ref={operationsRef}
              ticket={ticket}
              isEditMode={isEditMode}
            />
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

      {/* Outward Modal */}
      <Dialog open={openOutwardModal} onClose={() => setOpenOutwardModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          Deliver / Mark Outward
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Complete the handover process for this device. This will close the ticket and generate an outward record.
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <TextField
              size="small"
              label="Handed over to (Name)"
              value={outwardForm.handoverToName}
              onChange={e => setOutwardForm(prev => ({ ...prev, handoverToName: e.target.value }))}
              placeholder={ticket?.userRefNo?.firstName || 'Name'}
            />
            <TextField
              size="small"
              label="Phone No"
              value={outwardForm.handoverToPhone}
              onChange={e => setOutwardForm(prev => ({ ...prev, handoverToPhone: e.target.value }))}
              placeholder={ticket?.userRefNo?.mobileNo || 'Phone'}
            />
          </Box>
          <TextField
            fullWidth
            size="small"
            label="Outward Remarks"
            multiline
            rows={2}
            value={outwardForm.outwardRemarks}
            onChange={e => setOutwardForm(prev => ({ ...prev, outwardRemarks: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setOpenOutwardModal(false)} disabled={outwardMutation.isPending}>Cancel</Button>
          <Button variant="contained" color="secondary" onClick={handleOutwardSubmit} disabled={outwardMutation.isPending}>
            {outwardMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Confirm Handover'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}