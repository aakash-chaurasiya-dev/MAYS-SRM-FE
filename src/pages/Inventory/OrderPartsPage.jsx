import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, TextField, FormControlLabel, Checkbox, MenuItem, CircularProgress, Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useTheme } from '@mui/material/styles';
import { List } from '../../stereotype/AbstractList';
import api from '../../services/api';

export default function OrderPartsPage() {
  const theme = useTheme();
  
  const [parts, setParts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [inventory, setInventory] = useState([]); // Used for Products dropdown
  const [statuses, setStatuses] = useState([]);
  
  // Selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [clearSelectionKey, setClearSelectionKey] = useState(0);
  
  // Form State
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [isOutOfWarranty, setIsOutOfWarranty] = useState(false);
  
  // Delete Confirmation State
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const initialFormData = {
    partId: '',
    ticketId: '',
    quantity: 1,
    productId: '',
    statusId: '',
    returned: false,
    receiveDate: '',
    remarks: '',
  };
  const [formData, setFormData] = useState(initialFormData);

  const fetchParts = useCallback(async () => {
    try {
      const response = await api.get('/parts'); 
      const data = response.data?.data || response.data || [];
      
      setParts(data.map((p, i) => ({
        ...p,
        id: p.partId || `fallback-id-${i}`
      })));
    } catch (error) {
      console.error('Failed to fetch parts:', error);
    }
  }, []);

  useEffect(() => {
    fetchParts();

    const fetchTickets = async () => {
      try {
        const response = await api.get('/tickets');
        setTickets(response.data?.data || response.data || []);
      } catch (error) {}
    };
    fetchTickets();

    const fetchInventory = async () => {
      try {
        const response = await api.get('/inventory');
        setInventory(response.data?.data || response.data || []);
      } catch (error) {}
    };
    fetchInventory();

    const fetchStatuses = async () => {
      try {
        const response = await api.get('/statuses/type/parts');
        const partsStatuses = response.data?.data || response.data || [];
        setStatuses(partsStatuses);
      } catch (error) {}
    };
    fetchStatuses();
  }, [fetchParts]);

  // Fetch Ticket Details when Ticket ID changes
  useEffect(() => {
    if (!formData.ticketId || modalMode === 'update') {
      return; 
    }

    const fetchTicketDetails = async () => {
      setTicketLoading(true);
      try {
        const response = await api.get(`/tickets/${formData.ticketId}`);
        const ticket = response.data?.data || response.data;
        
        const isOut = ticket.warrantyType === 'OutOfWarranty' || ticket.warrantyType === 'Out of Warranty';
        const orderedStatus = statuses.find(s => s.statusName?.toLowerCase() === 'ordered');

        setFormData(prev => ({
          ...prev,
          statusId: orderedStatus ? orderedStatus.statusId : prev.statusId,
          returned: isOut ? false : prev.returned, 
        }));
        setIsOutOfWarranty(isOut);
      } catch (error) {
      } finally {
        setTicketLoading(false);
      }
    };

    fetchTicketDetails();
  }, [formData.ticketId, statuses, modalMode]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData(initialFormData);
    setIsOutOfWarranty(false);
    setOpenModal(true);
  };

  const handleOpenUpdateModal = () => {
    if (selectedIds.length !== 1) return;
    const partToUpdate = parts.find(p => String(p.id) === String(selectedIds[0]));
    if (partToUpdate) {
      setModalMode('update');
      
      let matchedStatusId = partToUpdate.statusId || '';
      if (!matchedStatusId && partToUpdate.statusName) {
        const match = statuses.find(s => s.statusName === partToUpdate.statusName);
        if (match) matchedStatusId = match.statusId;
      }
      
      let matchedProductId = partToUpdate.productId || '';
      if (!matchedProductId && partToUpdate.productName) {
        const match = inventory.find(i => i.productName === partToUpdate.productName);
        if (match) matchedProductId = match.productId;
      }

      setFormData({
        partId: partToUpdate.partId || '',
        ticketId: partToUpdate.ticketId || '',
        quantity: partToUpdate.quantity || 1,
        productId: matchedProductId,
        statusId: matchedStatusId,
        returned: partToUpdate.returned || false,
        receiveDate: partToUpdate.receiveDate ? new Date(partToUpdate.receiveDate).toISOString().slice(0,16) : '',
        remarks: partToUpdate.remarks || '',
      });
      setIsOutOfWarranty(false);
      setOpenModal(true);
    }
  };
  
  const handleCloseModal = () => setOpenModal(false);

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
      const payload = {
        ticketId: formData.ticketId || null,
        quantity: formData.quantity,
        productId: formData.productId || null,
        statusId: formData.statusId,
        returned: formData.returned,
        receiveDate: formData.receiveDate || null,
        remarks: formData.remarks || null,
      };

      if (modalMode === 'create') {
        await api.post('/parts', payload);
      } else {
        await api.put(`/parts/${formData.partId}`, payload);
        setSelectedIds([]);
        setClearSelectionKey(prev => prev + 1);
      }
      handleCloseModal();
      fetchParts();
    } catch (error) {
      console.error(`Failed to ${modalMode} part order:`, error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      const pId = selectedIds[0];
      await api.delete(`/parts/${pId}`);
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey(prev => prev + 1);
      fetchParts();
    } catch (error) {
      console.error('Failed to delete part:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending Approval': return '#B95000';
      case 'Ordered': return '#0052cc';
      case 'In Transit': return '#006c47';
      case 'Delivered': return '#2e7d32';
      case 'Returned': return '#ba1a1a';
      default: return theme.palette.text.secondary;
    }
  };

  const config = useMemo(() => ({
    title: 'Order Details',
    subtitle: `${parts.length} part orders`,
    rows: parts,
    columns: [
      { field: 'id', headerName: 'Part ID', width: 90 },
      { field: 'ticketId', headerName: 'Ticket ID', width: 100 },
      { 
        field: 'productName', 
        headerName: 'Product', 
        flex: 1.5,
        renderType: 'link',
        renderCell: (params) => {
          if (params.value) return params.value;
          const prod = inventory.find(i => i.productId === params.row?.productId);
          return prod ? prod.productName : '-';
        }
      },
      { field: 'quantity', headerName: 'Qty', width: 80 },
      { 
        field: 'orderDate', 
        headerName: 'Order Date', 
        flex: 1,
        renderCell: (params) => {
          if (!params.value) return '-';
          return new Date(params.value).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        }
      },
      { 
        field: 'receiveDate', 
        headerName: 'Receive Date', 
        flex: 1,
        renderCell: (params) => {
          if (!params.value) return '-';
          return new Date(params.value).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        }
      },
      { 
        field: 'statusName', 
        headerName: 'Status', 
        width: 130,
        renderCell: (params) => {
          const status = params.value || 'Unknown';
          const color = getStatusColor(status);
          return (
            <Box sx={{ display: 'inline-flex', px: 1, py: 0.2, borderRadius: '4px', fontSize: '11px', fontWeight: 600, bgcolor: `${color}1A`, color: color }}>
              {status}
            </Box>
          );
        }
      },
    ],
    checkboxSelection: true,
    searchable: true,
    searchPlaceholder: 'Search orders...',
    pagination: { pageSize: 10, pageSizeOptions: [5, 10, 25] },
    height: 480,
    gridKey: clearSelectionKey,
    actions: [
      { label: 'New Order', icon: <AddIcon />, variant: 'contained', color: 'primary', onClick: handleOpenCreateModal },
    ],
  }), [parts, inventory, clearSelectionKey, theme]);

  const lbl = {
    fontSize: '12px', fontWeight: 700, color: theme.palette.text.secondary,
    textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.8, mt: 2,
  };

  return (
    <Box sx={{ p: 1, pt: 1 }}>

      <List 
        config={config} 
        rowSelectionModel={selectedIds}
        onRowSelectionModelChange={setSelectedIds}
      />

      {/* Action Buttons for Update and Delete */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<EditOutlinedIcon />}
          disabled={selectedIds.length !== 1}
          onClick={handleOpenUpdateModal}
        >
          Update
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteOutlinedIcon />}
          disabled={selectedIds.length === 0}
          onClick={() => setOpenDeleteConfirm(true)}
        >
          Delete
        </Button>
      </Box>

      {/* ── Modal (Create/Update) ── */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, py: 2, px: 3 }}>
          {modalMode === 'create' ? 'Create New Part Order' : 'Update Part Order'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box component="form" id="part-form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography sx={{ ...lbl, mt: 0 }}>Ticket ID</Typography>
                <TextField 
                  select
                  name="ticketId" 
                  value={formData.ticketId} onChange={handleFormChange} 
                  fullWidth size="small" 
                  helperText={ticketLoading ? "Fetching..." : ""}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {tickets.map((ticket) => (
                    <MenuItem key={ticket.ticketId || ticket.id} value={ticket.ticketId || ticket.id}>
                      {ticket.ticketId || ticket.id}
                    </MenuItem>
                  ))}
                  {tickets.length === 0 && formData.ticketId && (
                    <MenuItem value={formData.ticketId}>{formData.ticketId}</MenuItem>
                  )}
                </TextField>
              </Box>
              <Box>
                <Typography sx={{ ...lbl, mt: 0 }}>Product (Inventory)</Typography>
                <TextField 
                  select
                  name="productId" 
                  value={formData.productId} onChange={handleFormChange} 
                  fullWidth size="small" 
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {inventory.map((inv) => (
                    <MenuItem key={inv.productId || inv.id} value={inv.productId || inv.id}>
                      {inv.productName}
                    </MenuItem>
                  ))}
                  {inventory.length === 0 && formData.productId && (
                    <MenuItem value={formData.productId}>{formData.productId}</MenuItem>
                  )}
                </TextField>
              </Box>
            </Box>

            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Quantity</Typography>
              <TextField 
                name="quantity" type="number" required 
                value={formData.quantity} onChange={handleFormChange} 
                fullWidth size="small" inputProps={{ min: 1 }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: modalMode === 'update' ? '1fr 1fr' : '1fr', gap: 2 }}>
              <Box>
                <Typography sx={{ ...lbl, mt: 0 }}>Status</Typography>
                <TextField 
                  select
                  name="statusId" required 
                  value={formData.statusId} onChange={handleFormChange} 
                  fullWidth size="small" 
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {statuses.map((status) => (
                    <MenuItem key={status.statusId} value={status.statusId}>
                      {status.statusName}
                    </MenuItem>
                  ))}
                  {statuses.length === 0 && formData.statusId && (
                    <MenuItem value={formData.statusId}>{formData.statusId}</MenuItem>
                  )}
                </TextField>
              </Box>
              {modalMode === 'update' && (
                <Box>
                  <Typography sx={{ ...lbl, mt: 0 }}>Receive Date</Typography>
                  <TextField 
                    name="receiveDate" type="datetime-local" 
                    value={formData.receiveDate} onChange={handleFormChange} 
                    fullWidth size="small" InputLabelProps={{ shrink: true }}
                  />
                </Box>
              )}
            </Box>

            <Box>
              <Typography sx={{ ...lbl, mt: 0 }}>Remarks</Typography>
              <TextField 
                name="remarks" 
                value={formData.remarks} onChange={handleFormChange} 
                fullWidth size="small" multiline rows={2}
              />
            </Box>

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
              label={<Typography sx={{ fontSize: '13px' }}>Returned to Vendor/Inventory</Typography>}
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal} color="inherit" disabled={submitLoading} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button 
            type="submit" form="part-form" 
            variant="contained" 
            disabled={submitLoading}
            sx={{ textTransform: 'none', minWidth: 100 }}
          >
            {submitLoading ? <CircularProgress size={24} color="inherit" /> : (modalMode === 'create' ? 'Create Order' : 'Update Order')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>Confirm Deletion</DialogTitle>
        <Divider />
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedIds.length === 1 ? 'this part order' : `these ${selectedIds.length} part orders`}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteConfirm(false)} color="inherit" disabled={deleteLoading}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteLoading} sx={{ minWidth: 90 }}>
             {deleteLoading ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}