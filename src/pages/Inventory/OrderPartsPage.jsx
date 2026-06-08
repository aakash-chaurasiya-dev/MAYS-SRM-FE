import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Chip, Divider, Button, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Link,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControlLabel, Checkbox, MenuItem
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import api from '../../services/api';

export default function OrderPartsPage() {
  const theme = useTheme();
  const [parts, setParts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Form State
  const [openModal, setOpenModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [isOutOfWarranty, setIsOutOfWarranty] = useState(false);
  const [formData, setFormData] = useState({
    ticketId: '',
    partName: '',
    quantity: 1,
    deviceTypeId: '',
    statusId: '',
    returned: false,
  });

  const fetchParts = async () => {
    setLoading(true);
    try {
      // Replace '/parts' with the actual endpoint that returns your list of PartsResponseDTO
      const response = await api.get('/parts'); 
      setParts(response.data);
    } catch (error) {
      console.error('Failed to fetch parts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();

    const fetchTickets = async () => {
      try {
        const response = await api.get('/tickets');
        setTickets(response.data?.data || response.data);
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
      }
    };
    fetchTickets();

    const fetchDeviceTypes = async () => {
      try {
        const response = await api.get('/devicetypes'); // Update endpoint if necessary
        setDeviceTypes(response.data?.data || response.data);
      } catch (error) {
        console.error('Failed to fetch device types:', error);
      }
    };
    fetchDeviceTypes();

    const fetchStatuses = async () => {
      try {
        const response = await api.get('/statuses'); // Update endpoint if necessary
        const allStatuses = response.data?.data || response.data;
        const partsStatuses = allStatuses.filter(s => s.statusType && s.statusType.toLowerCase() === 'parts');
        setStatuses(partsStatuses);
      } catch (error) {
        console.error('Failed to fetch statuses:', error);
      }
    };
    fetchStatuses();
  }, []);

  // Handlers for the form modal
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => {
    setOpenModal(false);
    // Reset form data on close
    setFormData({ ticketId: '', partName: '', quantity: 1, deviceTypeId: '', statusId: '', returned: false });
    setIsOutOfWarranty(false);
  };

  // Fetch Ticket Details when Ticket ID changes
  useEffect(() => {
    if (!formData.ticketId) {
      setIsOutOfWarranty(false);
      return;
    }

    const fetchTicketDetails = async () => {
      setTicketLoading(true);
      try {
        const response = await api.get(`/tickets/${formData.ticketId}`);
        const ticket = response.data?.data || response.data;
        
        const isOut = ticket.warrantyType === 'OutOfWarranty' || ticket.warrantyType === 'Out of Warranty';
        const deviceName = (ticket.deviceTypeName || '').toLowerCase();
        
        const matchedDevice = deviceName ? deviceTypes.find(d => {
          const frontName = (d.deviceTypeName || '').toLowerCase();
          const synonyms = {
            'phone': ['mobile', 'cell', 'iphone', 'smartphone'],
            'laptop': ['macbook', 'notebook'],
            'desktop': ['pc', 'computer', 'imac', 'tower'],
            'tablet': ['ipad'],
            'monitor': ['display', 'screen']
          };
          return frontName === deviceName || deviceName.includes(frontName) || (synonyms[frontName] && synonyms[frontName].some(syn => deviceName.includes(syn)));
        }) : undefined;
        
        const orderedStatus = statuses.find(s => s.statusName?.toLowerCase() === 'ordered');

        setFormData(prev => ({
          ...prev,
          deviceTypeId: matchedDevice ? matchedDevice.deviceTypeId : '',
          statusId: orderedStatus ? orderedStatus.statusId : prev.statusId,
          returned: isOut ? false : prev.returned, // Uncheck if out of warranty
        }));
        setIsOutOfWarranty(isOut);
      } catch (error) {
        console.error('Failed to fetch ticket details:', error);
      } finally {
        setTicketLoading(false);
      }
    };

    fetchTicketDetails();
  }, [formData.ticketId, deviceTypes, statuses]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      // Submits the payload mapped to your PartsRequestDTO
      await api.post('/parts', formData);
      handleCloseModal();
      fetchParts(); // Refresh the list after successful creation
    } catch (error) {
      console.error('Failed to create part order:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Function to determine chip color based on order status
  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending Approval': return '#B95000'; // Orange
      case 'Ordered': return '#0052cc';         // Blue
      case 'In Transit': return '#006c47';      // Teal
      case 'Delivered': return '#2e7d32';       // Green
      default: return theme.palette.text.secondary;
    }
  };

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>Order Parts</Typography>
          <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>Manage and track part orders from vendors</Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddOutlinedIcon />} onClick={handleOpenModal}>New Order</Button>
      </Box>

      {/* ── Top Stat Cards (Parts Status) ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: 2, mb: 3 }}>
        {[
          { label: 'Pending Approval', value: '3', color: '#B95000' },
          { label: 'Ordered', value: '5', color: '#0052cc' },
          { label: 'In Transit', value: '8', color: '#006c47' },
          { label: 'Delivered (30d)', value: '24', color: '#2e7d32' },
        ].map((stat) => (
          <Paper key={stat.label} elevation={1} sx={{ p: 2.5, borderRadius: '3px', textAlign: 'center' }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>
              {stat.label}
            </Typography>
            <Typography sx={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>{stat.value}</Typography>
          </Paper>
        ))}
      </Box>

      {/* ── Order History Table ── */}
      <Paper elevation={1} sx={{ borderRadius: '3px', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShippingOutlinedIcon sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
          <Typography sx={{ fontSize: '15px', fontWeight: 600 }}>Order History</Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: theme.palette.background.default }}>
              <TableRow>
                <TableCell sx={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: theme.palette.text.secondary }}>Part ID</TableCell>
                <TableCell sx={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: theme.palette.text.secondary }}>Ticket ID</TableCell>
                <TableCell sx={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: theme.palette.text.secondary }}>Part Name</TableCell>
                <TableCell sx={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: theme.palette.text.secondary }}>Device Type</TableCell>
                <TableCell sx={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: theme.palette.text.secondary }}>Quantity</TableCell>
                <TableCell sx={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: theme.palette.text.secondary }}>Returned</TableCell>
                <TableCell sx={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: theme.palette.text.secondary }}>Status</TableCell>
              </TableRow>
            </TableHead>
            {loading ? (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
              <TableBody>
                {parts.map((part) => (
                  <TableRow key={part.partId} hover>
                    <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: theme.palette.primary.main }}>{part.partId}</TableCell>
                    <TableCell sx={{ fontSize: '13px' }}>
                      {part.ticketId ? (
                        <Link component={RouterLink} to={`/tickets/${part.ticketId}`} underline="hover">
                          {part.ticketId}
                        </Link>
                      ) : '-'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '13px', fontWeight: 500 }}>{part.partName}</TableCell>
                    <TableCell sx={{ fontSize: '13px', color: theme.palette.text.secondary }}>{part.deviceTypeName}</TableCell>
                    <TableCell sx={{ fontSize: '13px' }}>{part.quantity}</TableCell>
                    <TableCell sx={{ fontSize: '13px' }}>{part.returned ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={part.statusName || 'Unknown'} 
                        size="small" 
                        sx={{ 
                          fontSize: '11px', fontWeight: 600, borderRadius: '2px', height: 20,
                          bgcolor: `${getStatusColor(part.statusName)}14`, 
                          color: getStatusColor(part.statusName) 
                        }} 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
        </TableContainer>
      </Paper>

      {/* ── New Order Modal ── */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '16px', fontWeight: 600 }}>Create New Part Order</DialogTitle>
        <Divider />
        <DialogContent>
          <Box component="form" id="new-part-form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField 
              select
              label="Ticket ID" name="ticketId" 
              value={formData.ticketId} onChange={handleFormChange} 
              fullWidth size="small" 
              helperText={ticketLoading ? "Fetching ticket details..." : (isOutOfWarranty ? "Device is out of warranty. Returns disabled." : "Optional: Link this part to a specific ticket")}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {tickets.map((ticket) => (
                <MenuItem key={ticket.ticketId || ticket.id} value={ticket.ticketId || ticket.id}>
                  {ticket.ticketId || ticket.id}
                </MenuItem>
              ))}
            </TextField>
            <TextField 
              label="Part Name" name="partName" required 
              value={formData.partName} onChange={handleFormChange} 
              fullWidth size="small" 
            />
            <TextField 
              label="Quantity" name="quantity" type="number" required 
              value={formData.quantity} onChange={handleFormChange} 
              fullWidth size="small" inputProps={{ min: 1 }}
            />
            <TextField 
              select
              label="Device Type" name="deviceTypeId" required 
              value={formData.deviceTypeId} onChange={handleFormChange} 
              fullWidth size="small" 
              disabled={!!formData.ticketId || ticketLoading}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {deviceTypes.map((device) => (
                <MenuItem key={device.deviceTypeId} value={device.deviceTypeId}>
                  {device.deviceTypeName}
                </MenuItem>
              ))}
            </TextField>
            <TextField 
              select
              label="Status" name="statusId" required 
              value={formData.statusId} onChange={handleFormChange} 
              fullWidth size="small" 
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status.statusId} value={status.statusId}>
                  {status.statusName}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Checkbox 
                  name="returned" 
                  checked={formData.returned} 
                  onChange={handleFormChange} 
                  color="primary"
                  disabled={isOutOfWarranty}
                />
              }
              label="Returned to Vendor/Inventory"
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal} color="inherit" disabled={submitLoading} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button 
            type="submit" form="new-part-form" 
            variant="contained" 
            disabled={submitLoading}
            sx={{ textTransform: 'none', minWidth: 100 }}
          >
            {submitLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Order'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}