import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button,
  Chip, Stack, CircularProgress, Card, CardContent,
} from '@mui/material';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { getUserRole } from '../../access/featureAccess';
import api from '../../services/api';
import NewEnquiryModal from './NewEnquiryModal';

const ACTION_LABEL = { 0: 'Enquiry', 1: 'Inward', 2: 'Outward' };

const getActionColor = (action) => {
  if (action === 1) return 'primary';   // Inward
  if (action === 2) return 'secondary'; // Outward
  return 'default';                     // Enquiry
};

const getStatusColor = (statusName) => {
  if (!statusName) return 'default';
  const s = statusName.toUpperCase();
  if (s.includes('TICKET_CREATED') || s.includes('HANDED_OFF') || s.includes('RESOLVED')) return 'success';
  if (s.includes('QUERIED') || s.includes('PENDING')) return 'warning';
  return 'default';
};

export default function EnquiriesPage() {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const rawRole = getUserRole(user);
  const isNormalUser = rawRole === 'ROLE_USER';

  const [searchQuery, setSearchQuery] = useState('');
  const [openCreateModal, setOpenCreateModal] = useState(false);

  // Listen for global sidebar "New Enquiry" event
  useEffect(() => {
    const handler = () => setOpenCreateModal(true);
    window.addEventListener('open-user-entry-modal', handler);
    return () => window.removeEventListener('open-user-entry-modal', handler);
  }, []);

  const { data: enquiries = [], isLoading: loading } = useQuery({
    queryKey: ['enquiries', isNormalUser ? 'user' : 'all'],
    queryFn: async () => {
      if (isNormalUser) {
        const meResponse = await api.get('/auth/me');
        const myId = meResponse.data.userId;
        const res = await api.get(`/enquiries/user/${myId}`);
        return res.data || [];
      }
      const res = await api.get('/enquiries');
      return res.data || [];
    },
  });

  const filteredEnquiries = enquiries.filter((enq) => {
    const q = searchQuery.toLowerCase();
    return (
      (enq.enquiryFor && enq.enquiryFor.toLowerCase().includes(q)) ||
      (enq.brandName && enq.brandName.toLowerCase().includes(q)) ||
      (enq.queryText && enq.queryText.toLowerCase().includes(q)) ||
      (enq.status && enq.status.toLowerCase().includes(q)) ||
      (enq.enquiryId && String(enq.enquiryId).includes(q)) ||
      (`${enq.userFirstName || ''} ${enq.userLastName || ''}`.toLowerCase().includes(q))
    );
  });

  return (
    <Box>
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
        <Box>
          <Typography
            sx={{
              fontSize: '20px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <SupportAgentOutlinedIcon color="primary" />
            {isNormalUser ? 'My Enquiries' : 'Enquiry Management Portal'}
          </Typography>
          <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
            {isNormalUser
              ? 'Submit general repair questions or model diagnostic requests'
              : 'Respond to and track incoming customer enquiries'}
          </Typography>
        </Box>
        {isNormalUser && (
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={() => setOpenCreateModal(true)}
            sx={{ fontWeight: 600, textTransform: 'none', py: 0.9 }}
          >
            New Enquiry
          </Button>
        )}
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={
            isNormalUser
              ? 'Search enquiries by brand, summary, status…'
              : 'Search by ID, customer name, brand, summary…'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <Box sx={{ mr: 1, display: 'flex', color: theme.palette.text.secondary }}>
                  <SearchOutlinedIcon fontSize="small" />
                </Box>
              ),
            },
          }}
          sx={{ bgcolor: theme.palette.background.paper }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredEnquiries.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            border: `1px dashed ${theme.palette.divider}`,
            bgcolor: 'transparent',
          }}
        >
          <HelpOutlineOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5 }} />
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.text.secondary }}>
            {searchQuery
              ? 'No enquiries match your search criteria.'
              : isNormalUser
                ? 'You have not submitted any enquiries yet.'
                : 'No customer enquiries found.'}
          </Typography>
          {isNormalUser && !searchQuery && (
            <Button
              variant="outlined"
              startIcon={<AddOutlinedIcon />}
              onClick={() => setOpenCreateModal(true)}
              sx={{ mt: 2, textTransform: 'none' }}
            >
              Create Enquiry
            </Button>
          )}
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2.5 }}>
          {filteredEnquiries.map((enq) => (
            <Card
              key={enq.enquiryId}
              elevation={1}
              onClick={() => navigate(`/enquiries/${enq.enquiryId}`)}
              sx={{
                cursor: 'pointer',
                borderRadius: '6px',
                borderLeft: `4px solid ${getStatusColor(enq.status) === 'success'
                    ? theme.palette.success.main
                    : getStatusColor(enq.status) === 'warning'
                      ? theme.palette.warning.main
                      : theme.palette.text.secondary
                  }`,
                transition: 'box-shadow 0.2s, transform 0.2s',
                '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
              }}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                {/* Header row */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography
                      sx={{ fontWeight: 600, fontSize: '13px', color: theme.palette.primary.main }}
                    >
                      ENQ-{enq.enquiryId}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: theme.palette.text.secondary,
                      }}
                    >
                      <AccessTimeIcon sx={{ fontSize: 13 }} />
                      <Typography sx={{ fontSize: '11px' }} component="span">
                        {enq.insertDate && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              color: theme.palette.text.secondary,
                            }}
                          >
                            <AccessTimeIcon sx={{ fontSize: 13 }} />
                            <Typography sx={{ fontSize: '11px' }}>
                              {new Date(enq.insertDate).toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    {/* Only renders if backend sends action */}
                    {enq.action !== undefined && enq.action !== null && (
                      <Chip
                        label={ACTION_LABEL[enq.action] || 'Enquiry'}
                        size="small"
                        color={getActionColor(enq.action)}
                        variant="outlined"
                        sx={{ fontWeight: 600, height: 20, fontSize: '11px' }}
                      />
                    )}
                    <Chip
                      label={enq.status || 'QUERIED'}
                      size="small"
                      color={getStatusColor(enq.status)}
                      sx={{ fontWeight: 600, borderRadius: '3px', height: 20, fontSize: '11px' }}
                    />
                  </Stack>
                </Box>

                {!isNormalUser && (
                  <Box
                    sx={{
                      mb: 1.5,
                      p: 1,
                      px: 1.5,
                      bgcolor: `${theme.palette.secondary.main}08`,
                      borderRadius: '4px',
                    }}
                  >
                    <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>
                      Enquirer: {enq.userFirstName} {enq.userLastName}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                  <LaptopMacIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                  <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                    {enq.brandName || 'Any Brand'}
                    {enq.deviceModelName ? ` ${enq.deviceModelName}` : ''}
                    {enq.serialNo ? ` (S/N: ${enq.serialNo})` : ''}
                  </Typography>
                </Box>

                <Typography sx={{ fontWeight: 700, fontSize: '15px', mb: 1 }}>
                  {enq.enquiryFor}
                </Typography>

                <Typography
                  sx={{
                    fontSize: '13.5px',
                    color: theme.palette.text.secondary,
                    mb: 2,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {enq.queryText}
                </Typography>

                {enq.remark ? (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor:
                        theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8f9fa',
                      borderRadius: '4px',
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.8,
                        mb: 1,
                        color: theme.palette.success.main,
                      }}
                    >
                      <CheckCircleOutlinedIcon sx={{ fontSize: 16 }} />
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: '12.5px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Response
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: '13px',
                        color: theme.palette.text.primary,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {enq.remark}
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      mt: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.8,
                      color: theme.palette.text.disabled,
                    }}
                  >
                    <ForumOutlinedIcon sx={{ fontSize: 15 }} />
                    <Typography sx={{ fontSize: '12px', fontStyle: 'italic' }}>
                      Awaiting response…
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <NewEnquiryModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
      />
    </Box>
  );
}