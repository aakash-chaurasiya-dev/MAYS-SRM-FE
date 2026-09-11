import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Paper, Typography, Button, Divider, Stack, Chip,
  TextField, MenuItem, CircularProgress, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import { useTheme } from '@mui/material/styles';
import api from '../../services/api';
import Can from '../../access/Can';
import { useAuth } from '../../contexts/AuthContext';
import { getUserRole } from '../../access/featureAccess';

const ACTION_OPTIONS = [
  { value: 0, label: 'Enquiry' },
  { value: 1, label: 'Inward' },
//   { value: 2, label: 'Outward' },
];




const getActionLabel = (a) =>
  ACTION_OPTIONS.find((o) => o.value === Number(a))?.label || 'Enquiry';

export default function EnquiryDetailPage() {

  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const rawRole = getUserRole(user);
  const isPortalUser = rawRole === 'ROLE_USER' || rawRole === 'ROLE_VENDOR';
  const canEditRemark = !isPortalUser;   // staff (Manager/Executive/Admin/Engineer/…) can edit
  const [isLocked, setIsLocked] = useState(false);

  const [form, setForm] = useState({
    enquiryFor: '',
    queryText: '',
    remark: '',
    status: 'QUERIED',
    action: 0,
    serialNo: '',
    brandId: null,
    modelId: null,
    customModelName: '',
  });

  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  // Fetch by id
  const { data: enquiry, isLoading } = useQuery({
    queryKey: ['enquiry', id],
    queryFn: async () => (await api.get(`/enquiries/${id}`)).data,
    enabled: !!id,
  });



  // Populate form when data arrives
  useEffect(() => {
    if (enquiry) {
      setForm({
        enquiryFor: enquiry.enquiryFor || '',
        queryText: enquiry.queryText || '',
        remark: enquiry.remark || '',
        action: enquiry.action ?? 0,
        serialNo: enquiry.serialNo || '',
        brandId: enquiry.brandId || null,
        modelId: enquiry.modelId || null,
        customModelName: enquiry.customModelName || '',
      });
      console.log("came here ", enquiry);
      if(enquiry.isConverted === true || (enquiry.remark !== "" && enquiry.remark !== "null")){
        setIsLocked(true);
      }
      console.log("isLocked ", isLocked);
    }
  }, [enquiry]);

  const updateMutation = useMutation({
    mutationFn: async (payload) => (await api.put(`/enquiries/${id}`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['enquiry', id] });
      queryClient.invalidateQueries({ queryKey: ['enquiries-pending-count'] });
      window.dispatchEvent(
        new CustomEvent('app-notification', {
          detail: { message: 'Enquiry updated successfully!', severity: 'success' },
        })
      );
    },
    onError: (err) => {
      window.dispatchEvent(
        new CustomEvent('app-notification', {
          detail: {
            message: err?.response?.data?.message || 'Failed to update enquiry',
            severity: 'error',
          },
        })
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => await api.delete(`/enquiries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['enquiries-pending-count'] });
      window.dispatchEvent(
        new CustomEvent('app-notification', {
          detail: { message: 'Enquiry deleted.', severity: 'success' },
        })
      );
      navigate('/enquiries');
    },
    onError: (err) => {
      window.dispatchEvent(
        new CustomEvent('app-notification', {
          detail: {
            message: err?.response?.data?.message || 'Failed to delete enquiry',
            severity: 'error',
          },
        })
      );
    },
  });

  const convertMutation = useMutation({
    mutationFn: async () => (await api.post(`/enquiries/${id}/convert-to-ticket`)).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['enquiry', id] });
      window.dispatchEvent(
        new CustomEvent('app-notification', {
          detail: { message: 'Converted to Ticket successfully!', severity: 'success' },
        })
      );
      if (data?.ticketId) navigate(`/tickets/${data.ticketId}`);
    },
    onError: (err) => {
      window.dispatchEvent(
        new CustomEvent('app-notification', {
          detail: {
            message: err?.response?.data?.message || 'Failed to convert',
            severity: 'error',
          },
        })
      );
    },
  });

  const handleUpdate = (e) => {
    e.preventDefault();
    const payload = {
      userId: enquiry?.userId || null,
      enquiryFor: form.enquiryFor,
      queryText: form.queryText,
      remark: form.remark || null,
      status: form.status,
      action: Number(form.action),
      serialNo: form.serialNo,
      brandId: form.brandId || null,
      modelId: form.modelId || null,
      customModelName: form.customModelName || null,
    };
    updateMutation.mutate(payload);
  };

  const labelSx = {
    fontSize: '12px',
    fontWeight: 700,
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    mb: 0.8,
    mt: 2,
  };

  const sectionHeaderSx = {
    px: 2.5,
    py: 1.8,
    bgcolor: `${theme.palette.primary.main}06`,
    borderBottom: `1px solid ${theme.palette.divider}`,
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!enquiry) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 600 }}>Enquiry not found.</Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/enquiries')}>
          Back to Enquiries
        </Button>
      </Box>
    );
  }

  return (
    <Box disabled={enquiry.isConverted}>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate('/enquiries')} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
              Enquiry ENQ-{enquiry.enquiryId}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
              <Chip
                label={getActionLabel(enquiry.action)}
                size="small"
                color={
                  enquiry.action === 1
                    ? 'primary'
                    : enquiry.action === 2
                    ? 'secondary'
                    : 'default'
                }
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label={enquiry.status || 'QUERIED'}
                size="small"
                color={
                  enquiry.status === 'TICKET_CREATED' || enquiry.status === 'HANDED_OFF'
                    ? 'success'
                    : 'warning'
                }
                sx={{ fontWeight: 600 }}
              />
              {enquiry.isConverted && (
                <Chip
                  label={`Converted to TICK-${enquiry.convertedTicketId}`}
                  size="small"
                  color="success"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Stack>
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
        <Can feature={'enquiries_Permission'}>
          {!enquiry.isConverted && enquiry.action === 1 && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={
                convertMutation.isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <ConfirmationNumberOutlinedIcon />
                )
              }
              onClick={() => convertMutation.mutate()}
              disabled={convertMutation.isPending}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Convert to Ticket
            </Button>
          )}
          </Can>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlineIcon />}
            onClick={() => setOpenDeleteConfirm(true)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Delete
          </Button>
        </Stack>
      </Box>

      <form onSubmit={handleUpdate}>
        {/* Customer Info (read-only) */}
        <Paper elevation={1} sx={{ borderRadius: '6px', overflow: 'hidden', mb: 2.5 }}>
          <Box sx={sectionHeaderSx}>
            <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Customer</Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelSx}>Name</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={`${enquiry.userFirstName || ''} ${enquiry.userLastName || ''}`.trim()}
                  InputProps={{ readOnly: true }} 
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelSx}>Mobile</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={enquiry.mobileNo || ''}
                  InputProps={{ readOnly: true }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelSx}>Email</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={enquiry.emailId || ''}
                  InputProps={{ readOnly: true }}
                />
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Editable fields */}
        <Paper elevation={1} sx={{ borderRadius: '6px', overflow: 'hidden', mb: 2.5 }}>
          <Box sx={sectionHeaderSx}>
            <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Enquiry Details</Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 2.5 }}>

            {/* Purpose + Status */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ ...labelSx, mt: 0 }}>Purpose</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={form.action}
                  onChange={(e) => setForm((p) => ({ ...p, action: e.target.value }))}
                  disabled={isLocked}
                >
                  {ACTION_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ ...labelSx, mt: 0 }}>Status</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={enquiry.status}
                  disabled
                >
                  <MenuItem value={enquiry.status}>{enquiry.status}</MenuItem>
                </TextField>
              </Box>
            </Box>

            {/* Brand / Model / Serial */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelSx}>Brand</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={enquiry.brandName || ''}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelSx}>Model</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={enquiry.deviceModelName || ''}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelSx}>Serial No</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={form.serialNo}
                  onChange={(e) => setForm((p) => ({ ...p, serialNo: e.target.value }))}
                  slotProps={{ input: { readOnly: isLocked } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '13px',
                      bgcolor: isLocked ? theme.palette.action.hover : 'transparent',
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Enquiry Summary */}
            <Typography sx={labelSx}>Enquiry Summary</Typography>
            <TextField
              fullWidth
              size="small"
              value={form.enquiryFor}
              onChange={(e) => setForm((p) => ({ ...p, enquiryFor: e.target.value }))}
              slotProps={{ input: { readOnly: isLocked } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: isLocked ? theme.palette.action.hover : 'transparent',
                },
              }}
            />

            {/* Query Description */}
            <Typography sx={labelSx}>Query Description</Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={form.queryText}
              onChange={(e) => setForm((p) => ({ ...p, queryText: e.target.value }))}
              slotProps={{ input: { readOnly: isLocked } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '13px',
                  bgcolor: isLocked ? theme.palette.action.hover : 'transparent',
                },
              }}
            />

            {/* Remark */}
            <Typography sx={labelSx}>Remark / Response</Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={form.remark}
              onChange={(e) => setForm((p) => ({ ...p, remark: e.target.value }))}
              placeholder={
                canEditRemark
                  ? 'Add response / resolution notes…'
                  : 'No remark yet.'
              }
              slotProps={{ input: { readOnly: !canEditRemark } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '13px',
                  bgcolor: canEditRemark ? 'transparent' : theme.palette.action.hover,
                },
              }}
            />

            {isLocked && (
              <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary, mt: 1.5, fontStyle: 'italic' }}>
                This enquiry is locked because it has been {enquiry.isConverted ? 'converted to a ticket' : 'responded to'}.
              </Typography>
            )}

          </Box>
        </Paper>

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/enquiries')}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={
              updateMutation.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SaveOutlinedIcon />
              )
            }
            disabled={updateMutation.isPending || isLocked}
          >
            Save Changes
          </Button>
        </Box>
      </form>

      {/* Delete confirm dialog */}
      <Dialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Enquiry?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '14px' }}>
            Are you sure you want to delete ENQ-{enquiry.enquiryId}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteConfirm(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}