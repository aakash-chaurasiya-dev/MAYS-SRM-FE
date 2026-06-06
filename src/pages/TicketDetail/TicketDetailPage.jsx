import { useEffect, useRef, useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Divider, Chip,
  Stack, Avatar, IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import api from '../../services/api';


const MILESTONES = [
  { label: 'Check-In', date: 'Oct 24, 2023', done: true },
  { label: 'Triage', date: 'Oct 24, 2023', done: true },
  { label: 'Diagnosis', date: 'Oct 25, 2023', done: true },
  { label: 'Repair', date: 'Pending', done: false },
  { label: 'QA Check', date: '—', done: false },
  { label: 'Ready for Pickup', date: '—', done: false },
];

const formatTimestamp = (value) => {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const createTimelineEntry = (log) => {
  const actor = log?.assignorEmployee?.employeeName || log?.assigneeEmployee?.employeeName || 'System';
  const timestamp = formatTimestamp(log?.timestamp);

  if (log?.assignorRemarks) {
    return {
      user: actor,
      action: log.assignorRemarks,
      timestamp,
      type: 'update',
    };
  }

  if (log?.columnName) {
    const oldValue = log.oldValue || 'Not available';
    const newValue = log.newValue || 'Not available';

    return {
      user: actor,
      action: `${log.columnName} updated from ${oldValue} to ${newValue}`,
      timestamp,
      type: 'update',
    };
  }

  return {
    user: actor,
    action: 'Ticket updated',
    timestamp,
    type: 'update',
  };
};

export default function TicketDetailPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef(null);
  const [ticket, setTicket] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  const loadTicketDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        ticketResponse,
        logsResponse,
        attachmentsResponse,
      ] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/ticket-logs/${id}`),
        api.get(`/tickets/${id}/attachments`),
      ]);

      const ticketData = ticketResponse.data;
      const logsData = logsResponse.data;
      const attachmentsData = attachmentsResponse.data;

      const currentTicketId = Number(id);

      const filteredLogs = Array.isArray(logsData)
        ? logsData
          .filter(
            (log) => Number(log?.ticket?.ticketId) === currentTicketId
          )
          .map(createTimelineEntry)
        : [];

      setTicket(ticketData);
      setAttachments(
        Array.isArray(attachmentsData)
          ? attachmentsData
          : []
      );
      setTimeline(filteredLogs);
    } catch (err) {
      console.error('Failed to load ticket details', err);

      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to load ticket details'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicketDetails();
  }, [id]);

  const handleAttachmentUpload = async (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setUploading(true);
    setUploadMessage('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await api.post(
        `/tickets/${id}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setUploadMessage(`Uploaded ${selectedFile.name}`);
      await loadTicketDetails();
    } catch (err) {
      setError(err.message || 'Unable to upload attachment');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5,
  };

  const valueOrNA = (value) => {
    if (value === undefined || value === null || value === '') {
      return 'Not available';
    }

    return String(value);
  };

  const status = valueOrNA(ticket?.ticketStatusName);
  const statusChipColor = status === 'OPEN' ? 'error' : status === 'CLOSED' ? 'success' : 'default';

  const customerName = [ticket?.userFirstName, ticket?.userLastName]
    .filter(Boolean)
    .join(' ');

  const customerInitials = customerName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'NA';

  const brand = valueOrNA(ticket?.deviceBrandName);
  const model = valueOrNA(ticket?.deviceModelName);
  const deviceName = ticket?.deviceModelName || 'Not available';

  const ticketCode = ticket?.ticketId ? `TK-${ticket.ticketId}` : 'Not available';
  const ticketTitle = deviceName !== 'Not available' ? `${deviceName}` : 'Ticket details';
  const issueDescription = valueOrNA(ticket?.ticketDescription);
  const customerEmail = valueOrNA(ticket?.emailId);
  const customerPhone = valueOrNA(ticket?.userMobileNo);
  const assignedTo = valueOrNA(ticket?.employeeName);
  const department = valueOrNA(ticket?.departmentName);
  const ticketType = valueOrNA(ticket?.ticketTypeName);
  const branch = valueOrNA(ticket?.branchName);
  const serialNo = valueOrNA(ticket?.deviceSerialNo);
  const warranty = valueOrNA(ticket?.warrantyType);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <IconButton size="small" onClick={() => navigate(-1)} sx={{ color: theme.palette.text.secondary }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography sx={{ fontSize: '11px', fontWeight: 600, color: theme.palette.text.secondary, letterSpacing: '0.04em' }}>
          MAIN WORKSHOP (TERMINAL A-12)
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
          {loading ? 'Loading ticket details…' : ticketTitle}
        </Typography>
        <Chip
          label={ticketCode}
          size="small"
          sx={{ fontWeight: 600, borderRadius: '2px', bgcolor: `${theme.palette.primary.main}14`, color: theme.palette.primary.main, height: 22 }}
        />
        <Chip
          label={status}
          size="small"
          color={statusChipColor}
          sx={{ fontWeight: 600, borderRadius: '2px', height: 22 }}
        />
      </Box>

      {error && (
        <Typography sx={{ fontSize: '13px', color: 'error.main', mt: 1, mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box sx={{ display: 'flex', justifyContent:'flex-end', gap: 1.5, mb: 3 }}>
        <Button variant="outlined" size="small" startIcon={<EditOutlinedIcon />} sx={{ fontSize: '12px' }}>Edit</Button>
        <Button variant="outlined" size="small" startIcon={<SaveOutlinedIcon />} sx={{ fontSize: '12px' }}>Save</Button>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
        {/* Left Column */}
        <Box sx={{ flex: 0.7 }}>
          {/* Issue Description */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{ px: 2.5, py: 1.8 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Issue Description</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <Box sx={{ bgcolor: theme.palette.background.default, borderRadius: '3px', border: `1px solid ${theme.palette.divider}`, p: 2, borderLeft: `3px solid ${theme.palette.primary.main}` }}>
                <Typography sx={{ fontSize: '13px', color: theme.palette.text.primary, lineHeight: 1.7, fontStyle: issueDescription === 'Not available' ? 'normal' : 'italic' }}>
                  {issueDescription}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Stack direction="row" spacing={2.5} flexWrap="wrap" useFlexGap>
            {/* Customer Information */}
            <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5,  width: '50%' }}>
              <Box sx={{ px: 2.5, py: 1.8, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonOutlinedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Customer Information</Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: theme.palette.primary.main, fontSize: '0.85rem', fontWeight: 700 }}>{customerInitials}</Avatar>
                  <Box>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>{valueOrNA(customerName)}</Typography>
                    <Chip label="Professional Client" size="small" sx={{ fontSize: '10px', height: 18, borderRadius: '2px', bgcolor: `${theme.palette.secondary.main}14`, color: theme.palette.secondary.main }} />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                  {[['Email', customerEmail], ['Phone', customerPhone], ['Branch', branch]].map(([l, v]) => (
                    <Box key={l} sx={{ mb: 1.2 }}>
                      <Typography sx={lbl}>{l}</Typography>
                      <Typography sx={{ fontSize: '13px' }}>{v}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Paper>

            {/* Device Details */}
            <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5, width: '50%' }}>
              <Box sx={{ px: 2.5, py: 1.8, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LaptopMacIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Device Details</Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  {[['Brand', brand], ['Model', model], ['Serial No.', serialNo], ['Warranty', warranty], ['Type', ticketType], ['Assigned To', assignedTo], ['Department', department]].map(([l, v]) => (
                    <Box key={l} sx={{ mb: 1.2, width: '33.33%' }}>
                      <Typography sx={lbl}>{l}</Typography>
                      <Typography sx={{ fontSize: '13px', fontFamily: l === 'Serial No.' ? '"JetBrains Mono", monospace' : 'inherit' }}>{v}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Paper>
          </Stack>

          {/* Attachments */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{ px: 2.5, py: 1.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Attachments ({attachments.length})</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  hidden
                  onChange={handleAttachmentUpload}
                />
                <Button
                  size="small"
                  sx={{ fontSize: '12px' }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading…' : 'Upload'}
                </Button>
              </Box>
            </Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              {uploadMessage && (
                <Typography sx={{ fontSize: '12px', color: 'success.main', mb: 1.5 }}>
                  {uploadMessage}
                </Typography>
              )}
              {attachments.length === 0 ? (
                <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
                  No attachments available for this ticket.
                </Typography>
              ) : (
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                  {attachments.map((attachment) => {
                    const isImage = /\.(jpe?g|png|gif|bmp|webp)$/i.test(attachment.fileName || '');
                    return (
                      <Box
                        key={attachment.attachmentId || attachment.fileName}
                        component={isImage && attachment.fileUrl ? 'div' : 'a'}
                        href={!isImage ? (attachment.fileUrl || '#') : undefined}
                        target={!isImage ? '_blank' : undefined}
                        rel={!isImage ? 'noreferrer' : undefined}
                        sx={{
                          width: 150,
                          minHeight: 140,
                          borderRadius: '6px',
                          bgcolor: theme.palette.background.default,
                          border: `1.5px solid ${theme.palette.divider}`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: isImage && attachment.fileUrl ? 'zoom-in' : (attachment.fileUrl ? 'pointer' : 'default'),
                          textDecoration: 'none',
                          px: 1.5,
                          py: 1.5,
                          boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)',
                          transition: 'box-shadow 0.18s, border-color 0.18s',
                          '&:hover': attachment.fileUrl ? { borderColor: theme.palette.primary.main, boxShadow: '0 4px 16px 0 rgba(0,82,204,0.10)' } : undefined,
                        }}
                        onClick={isImage && attachment.fileUrl ? () => { setLightboxImg({ url: attachment.fileUrl, name: attachment.fileName }); setLightboxOpen(true); } : undefined}
                      >
                        {isImage && attachment.fileUrl ? (
                          <Box
                            component="img"
                            src={attachment.fileUrl}
                            alt={attachment.fileName || 'Attachment'}
                            sx={{
                              width: 90,
                              height: 90,
                              objectFit: 'cover',
                              borderRadius: '4px',
                              mb: 1,
                              background: theme.palette.background.paper,
                              border: `1px solid ${theme.palette.divider}`,
                              boxShadow: '0 1px 6px 0 rgba(0,0,0,0.08)',
                            }}
                          />
                        ) : (
                          <ImageOutlinedIcon sx={{ fontSize: 36, color: theme.palette.divider, mb: 1 }} />
                        )}
                        <Typography sx={{ fontSize: '12px', color: theme.palette.text.primary, textAlign: 'center', fontWeight: 600, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {attachment.fileName || 'Attachment'}
                        </Typography>
                        <Typography sx={{ fontSize: '10px', color: theme.palette.text.secondary, textAlign: 'center', mt: 0.5 }}>
                          {formatTimestamp(attachment.uploadedAt)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>
          </Paper>

        </Box>

        {/* Right Column */}
        <Box sx={{ flex: 0.3}}>

          {/* Post Internal Update */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{ px: 2.5, py: 1.8 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Post Internal Update</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <TextField fullWidth multiline rows={3} placeholder="Add an internal note or status update…" value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }} />
              <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" size="small" startIcon={<SendOutlinedIcon />}>Post Update</Button>
              </Box>
            </Box>
          </Paper>
          
          {/* Key Milestones
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{ px: 2.5, py: 1.8, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarTodayOutlinedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Key Milestones</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              {MILESTONES.map((m, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.8 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutlinedIcon sx={{ fontSize: 16, color: m.done ? theme.palette.secondary.main : theme.palette.divider }} />
                    <Typography sx={{ fontSize: '13px', fontWeight: m.done ? 600 : 400, color: m.done ? theme.palette.text.primary : theme.palette.text.secondary }}>{m.label}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '11px', color: theme.palette.text.secondary }}>{m.date}</Typography>
                </Box>
              ))}
            </Box>
          </Paper> */}

          {/* Operations */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{ px: 2.5, py: 1.8 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Operations</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              <Stack spacing={1}>
                <Button variant="contained" fullWidth size="small">Escalate to Manager</Button>
                <Button variant="outlined" fullWidth size="small">Request Parts</Button>
                <Button variant="outlined" fullWidth size="small" color="error">Mark as Critical</Button>
              </Stack>
            </Box>
          </Paper>

          
           {/* Activity Timeline */}
          <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.8 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Activity Timeline</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              {timeline.length === 0 ? (
                <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>
                  No activity available for this ticket yet.
                </Typography>
              ) : (
                timeline.map((entry, i) => (
                  <Box key={`${entry.user}-${entry.timestamp}-${i}`} sx={{ display: 'flex', gap: 1.5, mb: i < timeline.length - 1 ? 2.5 : 0, position: 'relative' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.3 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.type === 'system' ? theme.palette.text.secondary : theme.palette.primary.main, flexShrink: 0 }} />
                      {i < timeline.length - 1 && <Box sx={{ width: 1, flex: 1, bgcolor: theme.palette.divider, mt: 0.5 }} />}
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
        </Box>
      </Stack>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth="md" fullWidth>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
          {lightboxImg && (
            <>
              <Box
                component="img"
                src={lightboxImg.url}
                alt={lightboxImg.name || 'Preview'}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  borderRadius: '8px',
                  boxShadow: '0 2px 16px 0 rgba(0,0,0,0.18)',
                  mb: 2,
                }}
              />
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.text.primary, textAlign: 'center', mb: 1 }}>
                {lightboxImg.name}
              </Typography>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
