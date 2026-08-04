import { useState, useMemo } from 'react';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useTheme } from '@mui/material/styles';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { List } from '../../stereotype/AbstractList';
import api from '../../services/api';
import DeleteConfirmDialog from '../../components/DeleteConfirmDialog';
import OrderPartModal from './OrderPartModal';

export default function OrderPartsPage() {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState([]);
  const [clearSelectionKey, setClearSelectionKey] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingPart, setEditingPart] = useState(null);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  const { data: parts = [] } = useQuery({
    queryKey: ['parts'],
    queryFn: async () => {
      const response = await api.get('/parts');
      return response.data?.data || response.data || [];
    },
    select: (data) =>
      (data || []).map((p, i) => ({
        ...p,
        id: p.partId || `fallback-id-${i}`,
      })),
  });

  const deleteMutation = useMutation({
    mutationFn: (partId) => api.delete(`/parts/${partId}`),
    onSuccess: (_data, partId) => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-parts'] });
      setOpenDeleteConfirm(false);
      setSelectedIds([]);
      setClearSelectionKey((prev) => prev + 1);

      const deleted = parts.find((p) => String(p.id) === String(partId));
      if (deleted?.ticketId) {
        queryClient.invalidateQueries({ queryKey: ['ticket-parts', String(deleted.ticketId)] });
      }
    },
    onError: (error) => {
      console.error('Failed to delete part:', error);
      alert(error.response?.data?.message || error.message || 'Failed to delete part order');
    },
  });

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingPart(null);
    setOpenModal(true);
  };

  const handleOpenUpdateModal = () => {
    if (selectedIds.length !== 1) return;
    const partToUpdate = parts.find((p) => String(p.id) === String(selectedIds[0]));
    if (!partToUpdate) return;
    setModalMode('update');
    setEditingPart(partToUpdate);
    setOpenModal(true);
  };

  const handleModalClose = (saved) => {
    setOpenModal(false);
    setEditingPart(null);
    if (saved && modalMode === 'update') {
      setSelectedIds([]);
      setClearSelectionKey((prev) => prev + 1);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending Approval': return '#B95000';
      case 'Ordered': return '#0052cc';
      case 'In Transit': return '#006c47';
      case 'Delivered': return '#2e7d32';
      case 'Received': return '#2e7d32';
      case 'Used': return '#6a1b9a';
      case 'Returned': return '#ba1a1a';
      default: return theme.palette.text.secondary;
    }
  };

  const config = useMemo(() => ({
    title: 'Order Details',
    subtitle: `${parts.length} part orders`,
    rows: parts,
    columns: [
      { field: 'id', headerName: 'Order ID', width: 90 },
      { field: 'source', headerName: 'Source', width: 110 },
      { field: 'ticketId', headerName: 'Ticket', width: 90 },
      {
        field: 'productName',
        headerName: 'Product',
        flex: 1.5,
        renderCell: (params) => params.value || params.row?.partName || '-',
      },
      { field: 'quantity', headerName: 'Qty', width: 70 },
      {
        field: 'orderDate',
        headerName: 'Order Date',
        flex: 1,
        renderCell: (params) => {
          if (!params.value) return '-';
          return new Date(params.value).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        },
      },
      {
        field: 'statusName',
        headerName: 'Status',
        width: 130,
        renderCell: (params) => {
          const status = params.value || 'Unknown';
          const color = getStatusColor(status);
          return (
            <Box sx={{ display: 'inline-flex', px: 1, py: 0.2, borderRadius: '4px', fontSize: '11px', fontWeight: 600, bgcolor: `${color}1A`, color }}>
              {status}
            </Box>
          );
        },
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
  }), [parts, clearSelectionKey, theme]);

  return (
    <Box sx={{ p: 1, pt: 1 }}>
      <List
        config={config}
        rowSelectionModel={selectedIds}
        onRowSelectionModelChange={setSelectedIds}
      />

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

      <OrderPartModal
        open={openModal}
        onClose={handleModalClose}
        mode={modalMode}
        part={editingPart}
      />

      <DeleteConfirmDialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate(selectedIds[0])}
        itemType="part order"
        count={selectedIds.length}
        isLoading={deleteMutation.isPending}
      />
    </Box>
  );
}
