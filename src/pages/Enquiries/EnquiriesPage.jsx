import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Divider,
  MenuItem, Stack, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, IconButton, Card, CardContent
} from '@mui/material';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CloseIcon from '@mui/icons-material/Close';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function EnquiriesPage() {
  const theme = useTheme();
  const { user } = useAuth();

  const rawRole = user?.roles?.[0]?.authority || user?.role || 'ROLE_USER';
  const isNormalUser = rawRole === 'ROLE_USER';

  // API Data State
  const [enquiries, setEnquiries] = useState([]);
  const [brands, setBrands] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Actions State
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openReplyModal, setOpenReplyModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [createForm, setCreateForm] = useState({
    brandId: '',
    serialNo: '',
    enquiryFor: '',
    queryText: '',
  });

  const [replyForm, setReplyForm] = useState({
    remark: '',
    statusId: '',
  });

  // Fetch all necessary initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Brands
      const brandsRes = await api.get('/brands');
      setBrands(brandsRes.data || []);

      // 2. Fetch Enquiries depending on role
      if (isNormalUser) {
        const meResponse = await api.get('/auth/me');
        const myId = meResponse.data.userId;
        const enquiriesRes = await api.get(`/enquiries/user/${myId}`);
        setEnquiries(enquiriesRes.data || []);
      } else {
        const [enquiriesRes, statusesRes] = await Promise.all([
          api.get('/enquiries'),
          api.get('/statuses/type/enquiry')
        ]);
        setEnquiries(enquiriesRes.data || []);
        setStatuses(statusesRes.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch enquiry page data:', error);
    } finally {
      setLoading(false);
    }
  }, [isNormalUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle new enquiry submission
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.brandId || !createForm.enquiryFor || !createForm.queryText) {
      return;
    }
    setSubmitting(true);
    try {
      const meResponse = await api.get('/auth/me');
      const myId = meResponse.data.userId;

      const payload = {
        userId: myId,
        brandId: Number(createForm.brandId),
        serialNo: createForm.serialNo || '',
        enquiryFor: createForm.enquiryFor,
        queryText: createForm.queryText,
      };

      await api.post('/enquiries', payload);
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: { message: 'Enquiry submitted successfully!', severity: 'success' }
      }));
      
      setCreateForm({ brandId: '', serialNo: '', enquiryFor: '', queryText: '' });
      setOpenCreateModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to submit enquiry:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle staff reply and status change submission
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry) return;
    setSubmitting(true);
    try {
      // Find brand details to keep them during updating
      const matchedBrand = brands.find(b => b.brandName === selectedEnquiry.brandName);
      const matchedStatus = statuses.find(s => String(s.statusId) === String(replyForm.statusId)) || 
                            statuses.find(s => s.statusName === selectedEnquiry.statusName);

      // If user ID or profile of the enquirer is needed, we resolve from original enquiry context
      const payload = {
        remark: replyForm.remark,
        statusId: matchedStatus ? matchedStatus.statusId : null,
        brandId: matchedBrand ? matchedBrand.brandId : null,
        enquiryFor: selectedEnquiry.enquiryFor,
        queryText: selectedEnquiry.queryText,
        serialNo: selectedEnquiry.serialNo,
      };

      await api.put(`/enquiries/${selectedEnquiry.enquiryId}`, payload);
      window.dispatchEvent(new CustomEvent('app-notification', {
        detail: { message: 'Enquiry response updated!', severity: 'success' }
      }));

      setOpenReplyModal(false);
      setSelectedEnquiry(null);
      fetchData();
    } catch (error) {
      console.error('Failed to update enquiry response:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReply = (enq) => {
    setSelectedEnquiry(enq);
    const matchedStatus = statuses.find(s => s.statusName === enq.statusName);
    setReplyForm({
      remark: enq.remark || '',
      statusId: matchedStatus ? matchedStatus.statusId : '',
    });
    setOpenReplyModal(true);
  };

  // Filter Logic
  const filteredEnquiries = enquiries.filter(enq => {
    const q = searchQuery.toLowerCase();
    return (
      (enq.enquiryFor && enq.enquiryFor.toLowerCase().includes(q)) ||
      (enq.brandName && enq.brandName.toLowerCase().includes(q)) ||
      (enq.queryText && enq.queryText.toLowerCase().includes(q)) ||
      (enq.statusName && enq.statusName.toLowerCase().includes(q)) ||
      (enq.enquiryId && String(enq.enquiryId).includes(q)) ||
      (`${enq.userFirstName || ''} ${enq.userLastName || ''}`.toLowerCase().includes(q))
    );
  });

  const getStatusColor = (statusName) => {
    if (!statusName) return 'default';
    const status = statusName.toUpperCase();
    if (status.includes('PENDING') || status.includes('OPEN')) return 'warning';
    if (status.includes('REPLIED') || status.includes('RESOLVED') || status.includes('CLOSED')) return 'success';
    return 'default';
  };

  // UI styling tokens
  const sectionHeaderSx = {
    px: 2.5, py: 1.8,
    bgcolor: `${theme.palette.primary.main}06`,
    borderBottom: `1px solid ${theme.palette.divider}`
  };

  const labelSx = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.8, mt: 2,
  };

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 1 }}>
            <SupportAgentOutlinedIcon color="primary" />
            {isNormalUser ? 'My Enquiries' : 'Enquiry Management Portal'}
          </Typography>
          <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
            {isNormalUser ? 'Submit general repair questions or model diagnostic requests' : 'Respond to and track incoming customer enquiries'}
          </Typography>
        </Box>
        {isNormalUser && (
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={() => setOpenCreateModal(true)}
            sx={{ fontWeight: 600, textTransform: 'none', py: 0.9 }}
          >
            Submit New Enquiry
          </Button>
        )}
      </Box>

      {/* ── Search Input ── */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={isNormalUser ? "Search enquiries by brand, summary, status..." : "Search enquiries by ID, customer name, brand, summary..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}>
                  <SearchOutlinedIcon fontSize="small" />
                </Box>
              )
            }
          }}
          sx={{ bgcolor: theme.palette.background.paper }}
        />
      </Box>

      {/* ── Loading Spinner ── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredEnquiries.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', border: `1px dashed ${theme.palette.divider}`, bgcolor: 'transparent' }}>
          <HelpOutlineOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5 }} />
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.text.secondary }}>
            {searchQuery ? 'No enquiries match your search criteria.' : (isNormalUser ? 'You have not submitted any enquiries yet.' : 'No customer enquiries found.')}
          </Typography>
          {isNormalUser && !searchQuery && (
            <Button
              variant="outlined"
              startIcon={<AddOutlinedIcon />}
              onClick={() => setOpenCreateModal(true)}
              sx={{ mt: 2, textTransform: 'none' }}
            >
              Create General Enquiry
            </Button>
          )}
        </Paper>
      ) : (
        /* ── Enquiries Grid/List ── */
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2.5 }}>
          {filteredEnquiries.map((enq) => (
            <Card
              key={enq.enquiryId}
              elevation={1}
              sx={{
                borderRadius: '6px',
                borderLeft: `4px solid ${
                  getStatusColor(enq.statusName) === 'success'
                    ? theme.palette.success.main
                    : getStatusColor(enq.statusName) === 'warning'
                    ? theme.palette.warning.main
                    : theme.palette.text.secondary
                }`,
                transition: 'box-shadow 0.2s, transform 0.2s',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                },
              }}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                {/* Header info */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography sx={{ fontWeight: 600, fontSize: '13px', color: theme.palette.primary.main }}>
                      ENQ-{enq.enquiryId}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: theme.palette.text.secondary }}>
                      <AccessTimeIcon sx={{ fontSize: 13 }} />
                      <Typography sx={{ fontSize: '11px' }}>
                        {enq.timestamp ? new Date(enq.timestamp).toLocaleString() : 'N/A'}
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    label={enq.statusName || 'PENDING'}
                    size="small"
                    color={getStatusColor(enq.statusName)}
                    sx={{ fontWeight: 600, borderRadius: '3px', height: 20, fontSize: '11px' }}
                  />
                </Box>

                {/* Sender metadata for staff */}
                {!isNormalUser && (
                  <Box sx={{ mb: 1.5, p: 1, px: 1.5, bgcolor: `${theme.palette.secondary.main}08`, borderRadius: '4px' }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>
                      Enquirer: {enq.userFirstName} {enq.userLastName}
                    </Typography>
                  </Box>
                )}

                {/* Brand & Device */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                  <LaptopMacIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                  <Typography sx={{ fontWeight: 600, fontSize: '14px', color: 'text.primary' }}>
                    {enq.brandName || 'Any Brand'} {enq.serialNo ? `(S/N: ${enq.serialNo})` : ''}
                  </Typography>
                </Box>

                {/* Enquiry subject */}
                <Typography sx={{ fontWeight: 700, fontSize: '15px', mb: 1, color: theme.palette.text.primary }}>
                  {enq.enquiryFor}
                </Typography>

                {/* Enquiry body query */}
                <Typography sx={{ fontSize: '13.5px', color: theme.palette.text.secondary, mb: 2, whiteSpace: 'pre-wrap' }}>
                  {enq.queryText}
                </Typography>

                {/* Remarks/Replies section */}
                {enq.remark ? (
                  <Box sx={{ mt: 2, p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8f9fa', borderRadius: '4px', border: `1px solid ${theme.palette.divider}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1, color: theme.palette.success.main }}>
                      <CheckCircleOutlinedIcon sx={{ fontSize: 16 }} />
                      <Typography sx={{ fontWeight: 700, fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Solution Response
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '13px', color: theme.palette.text.primary, whiteSpace: 'pre-wrap' }}>
                      {enq.remark}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 0.8, color: theme.palette.text.disabled }}>
                    <ForumOutlinedIcon sx={{ fontSize: 15 }} />
                    <Typography sx={{ fontSize: '12px', fontStyle: 'italic' }}>
                      Awaiting response from technical support...
                    </Typography>
                  </Box>
                )}

                {/* Staff Response Action */}
                {!isNormalUser && (
                  <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ForumOutlinedIcon />}
                      onClick={() => handleOpenReply(enq)}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      {enq.remark ? 'Update Response' : 'Respond / Resolve'}
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* ── Customer Create Enquiry Modal ── */}
      <Dialog
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '4px' } }}
      >
        <DialogTitle sx={sectionHeaderSx}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 600 }}>Submit General Enquiry</Typography>
            <IconButton size="small" onClick={() => setOpenCreateModal(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <form onSubmit={handleCreateSubmit}>
          <DialogContent sx={{ px: 3, py: 2.5 }}>
            <Typography sx={{ fontSize: '13px', color: theme.palette.text.secondary, mb: 2 }}>
              Have questions regarding repairs, model availability, or estimated costs before lodging a service request? Ask our technicians here.
            </Typography>

            <Typography sx={{ ...labelSx, mt: 0 }}>Select Device Brand</Typography>
            <TextField
              fullWidth
              size="small"
              select
              value={createForm.brandId}
              onChange={(e) => setCreateForm(prev => ({ ...prev, brandId: e.target.value }))}
              required
              displayEmpty
            >
              <MenuItem value="" disabled>Select brand...</MenuItem>
              {brands.map((b) => (
                <MenuItem key={b.brandId} value={b.brandId}>{b.brandName}</MenuItem>
              ))}
            </TextField>

            <Typography sx={labelSx}>Device Serial Number (Optional)</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. S/N, Service Tag"
              value={createForm.serialNo}
              onChange={(e) => setCreateForm(prev => ({ ...prev, serialNo: e.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { fontFamily: '"JetBrains Mono", monospace', fontSize: '13px' } }}
            />

            <Typography sx={labelSx}>Enquiry Summary / Model</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. Broken screen fix estimate, Model X compatibility"
              value={createForm.enquiryFor}
              onChange={(e) => setCreateForm(prev => ({ ...prev, enquiryFor: e.target.value }))}
              required
            />

            <Typography sx={labelSx}>Details / Query Description</Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Provide as much details about your device model, specifications, or query to receive an accurate answer..."
              value={createForm.queryText}
              onChange={(e) => setCreateForm(prev => ({ ...prev, queryText: e.target.value }))}
              required
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
            />
          </DialogContent>
          <Divider />
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenCreateModal(false)} variant="outlined" disabled={submitting}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SendOutlinedIcon />}
              disabled={submitting}
            >
              Send Enquiry
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Staff Reply / Update Dialog ── */}
      <Dialog
        open={openReplyModal}
        onClose={() => { setOpenReplyModal(false); setSelectedEnquiry(null); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '4px' } }}
      >
        <DialogTitle sx={sectionHeaderSx}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 600 }}>Respond to Customer Enquiry</Typography>
            <IconButton size="small" onClick={() => { setOpenReplyModal(false); setSelectedEnquiry(null); }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        {selectedEnquiry && (
          <form onSubmit={handleReplySubmit}>
            <DialogContent sx={{ px: 3, py: 2.5 }}>
              <Box sx={{ mb: 2, p: 1.5, border: `1px solid ${theme.palette.divider}`, borderRadius: '4px', bgcolor: `${theme.palette.primary.main}04` }}>
                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: theme.palette.primary.main, mb: 0.5 }}>
                  CUSTOMER QUERY (ENQ-{selectedEnquiry.enquiryId})
                </Typography>
                <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>
                  For: {selectedEnquiry.enquiryFor}
                </Typography>
                <Typography sx={{ fontSize: '12px', color: theme.palette.text.secondary, mt: 0.5 }}>
                  {selectedEnquiry.queryText}
                </Typography>
              </Box>

              <Typography sx={{ ...labelSx, mt: 0 }}>Assign Reply Status</Typography>
              <TextField
                fullWidth
                size="small"
                select
                value={replyForm.statusId}
                onChange={(e) => setReplyForm(prev => ({ ...prev, statusId: e.target.value }))}
                required
              >
                {statuses.map((s) => (
                  <MenuItem key={s.statusId} value={s.statusId}>{s.statusName}</MenuItem>
                ))}
              </TextField>

              <Typography sx={labelSx}>Technician Remarks / Response Details</Typography>
              <TextField
                fullWidth
                multiline
                rows={5}
                placeholder="Write the response or solution advice here..."
                value={replyForm.remark}
                onChange={(e) => setReplyForm(prev => ({ ...prev, remark: e.target.value }))}
                required
                sx={{ '& .MuiOutlinedInput-root': { fontSize: '13px' } }}
              />
            </DialogContent>
            <Divider />
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => { setOpenReplyModal(false); setSelectedEnquiry(null); }} variant="outlined" disabled={submitting}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={20} color="inherit" /> : 'Submit Response'}
              </Button>
            </DialogActions>
          </form>
        )}
      </Dialog>
    </Box>
  );
}
